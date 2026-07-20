package com.luxart.ecommerce.colissimo;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.luxart.ecommerce.colissimo.dto.ColissimoApiResponse;
import com.luxart.ecommerce.colissimo.dto.ColissimoListContent;
import com.luxart.ecommerce.colissimo.dto.ColissimoParcel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor
@Slf4j
public class ColissimoSoapClient {

    private static final Pattern RESULT_PATTERN = Pattern.compile(
            "<(\\w+Result)>([\\s\\S]*?)</\\1>",
            Pattern.CASE_INSENSITIVE);

    private static final Pattern PDF_RESULT_PATTERN = Pattern.compile(
            "<getColisPdfResult[^>]*>([\\s\\S]*?)</getColisPdfResult>",
            Pattern.CASE_INSENSITIVE);

    private final ColissimoProperties properties;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    public List<ColissimoParcel> listAllParcels() {
        List<ColissimoParcel> all = new ArrayList<>();
        int page = 1;
        int totalPages = 1;

        while (page <= totalPages) {
            ColissimoListContent content = listParcelsPage(page);
            if (content.getColis() != null) {
                all.addAll(content.getColis());
            }
            totalPages = parseIntSafe(content.getNbPages(), page);
            page++;
        }

        return all;
    }

    public ColissimoListContent listParcelsPage(int page) {
        String body = """
                <ListeColis xmlns="http://tempuri.org/">
                  <page>%d</page>
                </ListeColis>
                """.formatted(page);

        String json = invoke("ListeColis", body, "ListeColisResult");
        ColissimoApiResponse response = parseJson(json, ColissimoApiResponse.class);

        if (!"success".equalsIgnoreCase(response.getResultType())) {
            throw new ColissimoApiException(
                    "ListeColis échoué: " + response.getResultCode() + " — " + json);
        }

        return objectMapper.convertValue(response.getResultContent(), ColissimoListContent.class);
    }

    public ColissimoParcel getParcel(String codeBarre) {
        String body = """
                <getColis xmlns="http://tempuri.org/">
                  <code_barre>%s</code_barre>
                </getColis>
                """.formatted(escapeXml(codeBarre));

        String json = invoke("getColis", body, "getColisResult");
        ColissimoApiResponse response = parseJson(json, ColissimoApiResponse.class);

        if (!"success".equalsIgnoreCase(response.getResultType())) {
            throw new ColissimoApiException(
                    "getColis échoué pour " + codeBarre + ": " + response.getResultCode());
        }

        return objectMapper.convertValue(response.getResultContent(), ColissimoParcel.class);
    }

    public String addParcel(String picJson) {
        String body = """
                <AjouterColis xmlns="http://tempuri.org/">
                  <pic>%s</pic>
                </AjouterColis>
                """.formatted(escapeXml(picJson));

        String json = invoke("AjouterColis", body, "AjouterColisResult");
        ColissimoApiResponse response = parseJson(json, ColissimoApiResponse.class);

        if (!"success".equalsIgnoreCase(response.getResultType())) {
            throw new ColissimoApiException(
                    "AjouterColis échoué: " + response.getResultCode() + " — " + json);
        }

        return extractCodeBarre(response);
    }

    public byte[] getParcelPdf(String codeBarre) {
        String body = """
                <getColisPdf xmlns="http://tempuri.org/">
                  <code_barre>%s</code_barre>
                </getColisPdf>
                """.formatted(escapeXml(codeBarre));

        String xml = invokeRaw("getColisPdf", body);
        Matcher matcher = PDF_RESULT_PATTERN.matcher(xml);
        if (!matcher.find()) {
            throw new ColissimoApiException("PDF Colissimo introuvable pour " + codeBarre);
        }

        String base64 = unescapeXml(matcher.group(1).trim());
        try {
            return Base64.getDecoder().decode(base64);
        } catch (IllegalArgumentException e) {
            throw new ColissimoApiException("PDF Colissimo invalide (base64)", e);
        }
    }

    public boolean isConfigured() {
        return properties.isEnabled()
                && properties.getUtilisateur() != null && !properties.getUtilisateur().isBlank()
                && properties.getPass() != null && !properties.getPass().isBlank();
    }

    private String invoke(String action, String bodyContent, String resultTag) {
        return extractResultJson(invokeRaw(action, bodyContent), resultTag);
    }

    private String invokeRaw(String action, String bodyContent) {
        String envelope = """
                <?xml version="1.0" encoding="utf-8"?>
                <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                               xmlns:xsd="http://www.w3.org/2001/XMLSchema"
                               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
                  <soap:Header>
                    <AuthHeader xmlns="http://tempuri.org/">
                      <Uilisateur>%s</Uilisateur>
                      <Pass>%s</Pass>
                    </AuthHeader>
                  </soap:Header>
                  <soap:Body>
                    %s
                  </soap:Body>
                </soap:Envelope>
                """.formatted(
                escapeXml(properties.getUtilisateur()),
                escapeXml(properties.getPass()),
                bodyContent);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.TEXT_XML);
        headers.set("SOAPAction", "\"http://tempuri.org/" + action + "\"");

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    properties.getEndpoint(),
                    HttpMethod.POST,
                    new HttpEntity<>(envelope, headers),
                    String.class);

            String xml = response.getBody();
            if (xml == null || xml.isBlank()) {
                throw new ColissimoApiException("Réponse Colissimo vide pour " + action);
            }

            return xml;
        } catch (RestClientException e) {
            throw new ColissimoApiException("Erreur réseau Colissimo (" + action + "): " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    private String extractCodeBarre(ColissimoApiResponse response) {
        Object content = response.getResultContent();
        if (content == null) {
            throw new ColissimoApiException("Colissimo n'a pas retourné de code à barre");
        }
        if (content instanceof String s && !s.isBlank()) {
            return s.trim();
        }
        if (content instanceof java.util.Map<?, ?> map) {
            Object code = map.get("code");
            if (code == null) {
                code = map.get("code_barre");
            }
            if (code != null) {
                return code.toString();
            }
        }
        throw new ColissimoApiException("Format de réponse Colissimo inattendu pour AjouterColis");
    }

    private String extractResultJson(String xml, String preferredTag) {
        Matcher matcher = RESULT_PATTERN.matcher(xml);
        while (matcher.find()) {
            String tag = matcher.group(1);
            if (tag.equalsIgnoreCase(preferredTag) || tag.toLowerCase().contains("result")) {
                return unescapeXml(matcher.group(2).trim());
            }
        }
        throw new ColissimoApiException("Impossible d'extraire " + preferredTag + " de la réponse SOAP");
    }

    private <T> T parseJson(String json, Class<T> type) {
        try {
            return objectMapper.readValue(json, type);
        } catch (Exception e) {
            throw new ColissimoApiException("JSON Colissimo invalide: " + e.getMessage(), e);
        }
    }

    private static int parseIntSafe(String value, int fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException e) {
            return fallback;
        }
    }

    private static String escapeXml(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }

    private static String unescapeXml(String value) {
        return value
                .replace("&lt;", "<")
                .replace("&gt;", ">")
                .replace("&quot;", "\"")
                .replace("&apos;", "'")
                .replace("&amp;", "&");
    }
}
