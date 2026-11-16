package com.luxart.ecommerce.colissimo;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.luxart.ecommerce.colissimo.dto.ColissimoAddParcelRequest;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.HttpURLConnection;
import java.security.SecureRandom;
import java.security.cert.X509Certificate;
import java.util.Locale;

@Component
@RequiredArgsConstructor
@Slf4j
public class ColissimodeliveryRestClient {

    private final ColissimoProperties properties;
    private final RestTemplate restTemplate = createSslTolerantRestTemplate();

    public record RestParcelCreationResult(String codeBarre, String lienImprimer) {}
    public record RestTrackingResult(String etat, String motif, String statusMessage) {}

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class PostResponse {
        private int status;
        private String lien;
        @JsonProperty("lien_zebra")
        private String lienZebra;
        @JsonProperty("status_message")
        private String statusMessage;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class EtatResponse {
        private int status;
        private String etat;
        private String motif;
        @JsonProperty("pre_etat")
        private String preEtat;
        @JsonProperty("pre_motif")
        private String preMotif;
        @JsonProperty("status_message")
        private String statusMessage;
    }

    public boolean isConfigured() {
        return properties.isEnabled()
                && properties.getTokenAjout() != null
                && !properties.getTokenAjout().isBlank();
    }

    /**
     * Crée un colis chez colissimodelivery.tn
     */
    public RestParcelCreationResult addParcel(ColissimoAddParcelRequest req) {
        String token = properties.getTokenAjout() != null ? properties.getTokenAjout().trim() : "";
        if (token.isBlank()) {
            throw new ColissimoApiException("Token d'ajout Colissimo manquant");
        }

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("token", token);
        body.add("nom", cleanNom(req.getClient()));
        body.add("gouvernerat", normalizeGovernorate(req.getGouvernorat()));
        body.add("ville", req.getVille() != null && !req.getVille().isBlank() ? req.getVille().trim() : "Tunis");
        body.add("adresse", req.getAdresse() != null && !req.getAdresse().isBlank() ? req.getAdresse().trim() : "Adresse");
        body.add("tel", cleanPhone(req.getTel1()));
        if (req.getTel2() != null && !req.getTel2().isBlank()) {
            body.add("tel2", cleanPhone(req.getTel2()));
        }
        body.add("designation", req.getDesignation() != null && !req.getDesignation().isBlank()
                ? req.getDesignation().trim()
                : "Tableau décoratif");

        BigDecimal prix = req.getPrix() != null ? req.getPrix() : BigDecimal.ZERO;
        body.add("prix", prix.setScale(0, RoundingMode.HALF_UP).toPlainString());

        int nb = req.getNbPieces() > 0 ? req.getNbPieces() : 1;
        body.add("nb_article", String.valueOf(nb));

        body.add("msg", req.getCommentaire() != null ? req.getCommentaire().trim() : "");
        body.add("echange", "non");
        body.add("article", "");
        body.add("nb_echange", "0");
        body.add("ouvrir", "0");
        body.add("fragile", "1");
        body.add("type_colis", "2");
        body.add("mode_paiement", "1");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        try {
            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            ResponseEntity<PostResponse> response = restTemplate.postForEntity(
                    properties.getRestPostUrl(),
                    requestEntity,
                    PostResponse.class);

            PostResponse bodyResp = response.getBody();
            if (bodyResp == null) {
                throw new ColissimoApiException("Réponse vide de colissimodelivery.tn");
            }
            if (bodyResp.getStatus() != 1 || bodyResp.getStatusMessage() == null || bodyResp.getStatusMessage().isBlank()) {
                throw new ColissimoApiException("Échec création colis Colissimo: " + bodyResp.getStatusMessage());
            }

            return new RestParcelCreationResult(bodyResp.getStatusMessage().trim(), bodyResp.getLien());
        } catch (RestClientException e) {
            throw new ColissimoApiException("Erreur réseau colissimodelivery.tn (post.php): " + e.getMessage(), e);
        }
    }

    /**
     * Récupère l'état d'un colis depuis colissimodelivery.tn
     */
    public RestTrackingResult getEtat(String codeBarre) {
        String token = properties.getTokenTracking() != null ? properties.getTokenTracking().trim() : "";
        if (token.isBlank()) {
            token = properties.getTokenAjout() != null ? properties.getTokenAjout().trim() : "";
        }
        if (codeBarre == null || codeBarre.isBlank()) {
            return null;
        }

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("token", token);
        body.add("code", codeBarre.trim());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        try {
            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            ResponseEntity<EtatResponse> response = restTemplate.postForEntity(
                    properties.getRestEtatUrl(),
                    requestEntity,
                    EtatResponse.class);

            EtatResponse bodyResp = response.getBody();
            if (bodyResp == null || bodyResp.getStatus() != 1) {
                return null;
            }

            return new RestTrackingResult(bodyResp.getEtat(), bodyResp.getMotif(), bodyResp.getStatusMessage());
        } catch (RestClientException e) {
            log.warn("Erreur réseau colissimodelivery.tn (etat.php pour {}): {}", codeBarre, e.getMessage());
            return null;
        }
    }

    public static String cleanPhone(String raw) {
        if (raw == null || raw.isBlank()) {
            return "00000000";
        }
        String digits = raw.replaceAll("\\D", "");
        if (digits.length() == 8) {
            return digits;
        }
        if (digits.length() > 8) {
            return digits.substring(digits.length() - 8);
        }
        return digits;
    }

    public static String cleanNom(String raw) {
        if (raw == null || raw.isBlank()) {
            return "Client";
        }
        return raw.trim();
    }

    public static String normalizeGovernorate(String raw) {
        if (raw == null || raw.isBlank()) {
            return "Tunis";
        }
        String clean = raw.toLowerCase(Locale.ROOT)
                .replace("é", "e")
                .replace("è", "e")
                .replace("ê", "e")
                .trim();

        if (clean.contains("ariana")) return "Ariana";
        if (clean.contains("beja")) return "Beja";
        if (clean.contains("ben arous")) return "Ben Arous";
        if (clean.contains("bizerte")) return "Bizerte";
        if (clean.contains("gabes")) return "Gabes";
        if (clean.contains("gafsa")) return "Gafsa";
        if (clean.contains("jendouba")) return "Jendouba";
        if (clean.contains("kairouan")) return "Kairouan";
        if (clean.contains("kasserine")) return "Kasserine";
        if (clean.contains("kebili")) return "Kebili";
        if (clean.contains("kef")) return "LE Kef";
        if (clean.contains("mahdia")) return "Mahdia";
        if (clean.contains("manouba")) return "Mannouba";
        if (clean.contains("medenine")) return "Medenine";
        if (clean.contains("monastir")) return "Monastir";
        if (clean.contains("nabeul")) return "Nabeul";
        if (clean.contains("sfax")) return "Sfax";
        if (clean.contains("sidi bouzid")) return "Sidi Bouzid";
        if (clean.contains("siliana")) return "Siliana";
        if (clean.contains("sousse")) return "Sousse";
        if (clean.contains("tataouine")) return "Tataouine";
        if (clean.contains("tozeur")) return "Tozeur";
        if (clean.contains("zaghouan")) return "Zaghouan";
        return "Tunis";
    }

    private static RestTemplate createSslTolerantRestTemplate() {
        try {
            SSLContext sslContext = SSLContext.getInstance("TLS");
            sslContext.init(null, new TrustManager[]{new X509TrustManager() {
                public void checkClientTrusted(X509Certificate[] chain, String authType) {}
                public void checkServerTrusted(X509Certificate[] chain, String authType) {}
                public X509Certificate[] getAcceptedIssuers() { return new X509Certificate[0]; }
            }}, new SecureRandom());

            SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory() {
                @Override
                protected void prepareConnection(HttpURLConnection connection, String httpMethod) throws IOException {
                    if (connection instanceof HttpsURLConnection httpsConnection) {
                        httpsConnection.setSSLSocketFactory(sslContext.getSocketFactory());
                        httpsConnection.setHostnameVerifier((hostname, session) -> true);
                    }
                    super.prepareConnection(connection, httpMethod);
                }
            };
            factory.setConnectTimeout(15_000);
            factory.setReadTimeout(30_000);
            return new RestTemplate(factory);
        } catch (Exception e) {
            log.warn("Impossible d'initialiser le SSL permissif pour colissimodelivery.tn: {}", e.getMessage());
            return new RestTemplate();
        }
    }
}

