package com.luxart.ecommerce.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Optional;

@Service
@Slf4j
public class RemoteImageFetchService {

    private final HttpClient httpClient;
    private final String sourceBaseUrl;

    public RemoteImageFetchService(
            @Value("${app.images.webp.source-base-url:}") String sourceBaseUrl) {
        this.sourceBaseUrl = sourceBaseUrl != null ? sourceBaseUrl.trim() : "";
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
    }

    public boolean isEnabled() {
        return !sourceBaseUrl.isBlank();
    }

    public Optional<byte[]> fetch(String publicUrl) {
        if (!isEnabled() || publicUrl == null || publicUrl.isBlank()) {
            return Optional.empty();
        }

        String normalizedPath = publicUrl.startsWith("/") ? publicUrl : "/" + publicUrl;
        String remoteUrl = sourceBaseUrl.replaceAll("/$", "") + normalizedPath;

        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(remoteUrl))
                    .timeout(Duration.ofSeconds(30))
                    .GET()
                    .build();

            HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.debug("Image téléchargée depuis {} ({} octets)", remoteUrl, response.body().length);
                return Optional.of(response.body());
            }

            log.warn("Téléchargement image échoué {} : HTTP {}", remoteUrl, response.statusCode());
            return Optional.empty();
        } catch (IOException | InterruptedException ex) {
            if (ex instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            log.warn("Téléchargement image échoué {} : {}", remoteUrl, ex.getMessage());
            return Optional.empty();
        }
    }
}
