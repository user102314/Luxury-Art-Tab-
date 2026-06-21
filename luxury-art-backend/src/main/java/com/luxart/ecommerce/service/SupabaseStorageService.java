package com.luxart.ecommerce.service;

import com.luxart.ecommerce.config.SupabaseProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SupabaseStorageService {

    private static final String PLACEHOLDER = "VOTRE_SERVICE_ROLE_KEY";

    private final SupabaseProperties supabaseProperties;
    private final RestClient restClient = RestClient.create();
    private final Path localRoot = Paths.get("uploads");

    public String upload(String storagePath, byte[] content, String contentType) {
        if (useSupabase()) {
            return uploadToSupabase(storagePath, content, contentType);
        }
        return uploadLocally(storagePath, content);
    }

    public void delete(String storagePath) {
        if (useSupabase()) {
            deleteFromSupabase(storagePath);
        } else {
            deleteLocally(storagePath);
        }
    }

    public String buildStoragePath(Long productId, String originalFilename) {
        String safeName = originalFilename != null
                ? originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_")
                : "image.jpg";
        return "products/" + productId + "/" + UUID.randomUUID() + "-" + safeName;
    }

    public String getPublicUrl(String storagePath) {
        if (useSupabase()) {
            return supabaseProperties.getUrl() + "/storage/v1/object/public/"
                    + supabaseProperties.getStorage().getBucket() + "/" + storagePath;
        }
        return "/uploads/" + storagePath.replace("\\", "/");
    }

    private boolean useSupabase() {
        String key = supabaseProperties.getServiceKey();
        return key != null && !key.isBlank() && !PLACEHOLDER.equals(key.trim());
    }

    private String uploadToSupabase(String storagePath, byte[] content, String contentType) {
        String uploadUrl = supabaseProperties.getUrl() + "/storage/v1/object/"
                + supabaseProperties.getStorage().getBucket() + "/" + storagePath;

        try {
            restClient.post()
                    .uri(uploadUrl)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + supabaseProperties.getServiceKey())
                    .header("x-upsert", "true")
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(content)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Échec upload Supabase Storage: " + ex.getResponseBodyAsString());
        }

        return getPublicUrl(storagePath);
    }

    private String uploadLocally(String storagePath, byte[] content) {
        try {
            Path target = localRoot.resolve(storagePath);
            Files.createDirectories(target.getParent());
            Files.write(target, content);
            log.info("Image enregistrée localement : {}", target);
            return getPublicUrl(storagePath);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Erreur enregistrement local: " + ex.getMessage());
        }
    }

    private void deleteFromSupabase(String storagePath) {
        String deleteUrl = supabaseProperties.getUrl() + "/storage/v1/object/"
                + supabaseProperties.getStorage().getBucket() + "/" + storagePath;

        try {
            restClient.method(HttpMethod.DELETE)
                    .uri(deleteUrl)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + supabaseProperties.getServiceKey())
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Échec suppression Supabase Storage: " + ex.getResponseBodyAsString());
        }
    }

    private void deleteLocally(String storagePath) {
        try {
            Files.deleteIfExists(localRoot.resolve(storagePath));
        } catch (IOException ex) {
            log.warn("Impossible de supprimer le fichier local : {}", storagePath);
        }
    }
}
