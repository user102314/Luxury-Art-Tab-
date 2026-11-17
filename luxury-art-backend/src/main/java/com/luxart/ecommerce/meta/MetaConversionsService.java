package com.luxart.ecommerce.meta;

import com.luxart.ecommerce.config.AsyncConfig;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/** Envoie les événements à l'API de conversions Meta (best-effort, jamais bloquant). */
@Slf4j
@Service
public class MetaConversionsService {

    private static final Set<String> ALLOWED_EVENTS = Set.of(
            "PageView", "ViewContent", "AddToCart", "InitiateCheckout", "Purchase");

    private final MetaProperties props;
    private final RestClient http = RestClient.create();

    public MetaConversionsService(MetaProperties props) {
        this.props = props;
    }

    /** Contexte HTTP capturé avant le passage en asynchrone. */
    public record ClientContext(String ip, String userAgent) {
        public static ClientContext from(HttpServletRequest req) {
            if (req == null) return new ClientContext(null, null);
            String xff = req.getHeader("X-Forwarded-For");
            String ip = (xff != null && !xff.isBlank()) ? xff.split(",")[0].trim() : req.getRemoteAddr();
            return new ClientContext(ip, req.getHeader("User-Agent"));
        }
    }

    public static boolean isAllowed(String eventName) {
        return eventName != null && ALLOWED_EVENTS.contains(eventName);
    }

    @Async(AsyncConfig.ANALYTICS_EXECUTOR)
    public void send(MetaEventRequest e, ClientContext ctx) {
        if (!props.isReady() || !isAllowed(e.getEventName())) return;
        try {
            Map<String, Object> userData = new LinkedHashMap<>();
            put(userData, "em", hashList(normText(e.getEmail())));
            put(userData, "ph", hashList(normPhone(e.getPhone())));
            put(userData, "fn", hashList(normText(e.getFirstName())));
            put(userData, "ln", hashList(normText(e.getLastName())));
            put(userData, "country", hashList("tn"));
            put(userData, "external_id", hashList(normText(e.getVisitorKey())));
            if (notBlank(e.getFbp())) userData.put("fbp", e.getFbp());
            if (notBlank(e.getFbc())) userData.put("fbc", e.getFbc());
            if (ctx != null) {
                if (notBlank(ctx.ip())) userData.put("client_ip_address", ctx.ip());
                if (notBlank(ctx.userAgent())) userData.put("client_user_agent", ctx.userAgent());
            }

            Map<String, Object> custom = new LinkedHashMap<>();
            if (e.getValue() != null) {
                custom.put("value", e.getValue());
                custom.put("currency", notBlank(e.getCurrency()) ? e.getCurrency() : props.getCurrency());
            }
            if (e.getContentIds() != null && !e.getContentIds().isEmpty()) {
                custom.put("content_ids", e.getContentIds());
                custom.put("content_type", "product");
            }
            if (notBlank(e.getContentName())) custom.put("content_name", e.getContentName());
            if (e.getNumItems() != null) custom.put("num_items", e.getNumItems());

            Map<String, Object> event = new LinkedHashMap<>();
            event.put("event_name", e.getEventName());
            event.put("event_time", Instant.now().getEpochSecond());
            event.put("event_id", e.getEventId());
            event.put("action_source", "website");
            event.put("event_source_url", safeUrl(e.getEventSourceUrl()));
            event.put("user_data", userData);
            if (!custom.isEmpty()) event.put("custom_data", custom);

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("data", List.of(event));
            if (notBlank(props.getTestEventCode())) body.put("test_event_code", props.getTestEventCode());

            http.post()
                    .uri("https://graph.facebook.com/{v}/{pixel}/events", props.getApiVersion(), props.getPixelId())
                    .header("Authorization", "Bearer " + props.getCapiToken())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();
            log.debug("Meta CAPI {} envoyé (event_id={})", e.getEventName(), e.getEventId());
        } catch (Exception ex) {
            // Ne jamais faire échouer une commande/page à cause de Meta ; jamais de token dans les logs.
            log.warn("Meta CAPI {} échec: {}", e.getEventName(), ex.getMessage());
        }
    }

    private String safeUrl(String url) {
        return notBlank(url) && url.startsWith("http") ? url : props.getSiteUrl();
    }

    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }

    private static void put(Map<String, Object> m, String k, List<String> v) {
        if (v != null) m.put(k, v);
    }

    static String normText(String s) {
        return notBlank(s) ? s.trim().toLowerCase(Locale.ROOT) : null;
    }

    /** Chiffres uniquement, avec indicatif pays (Tunisie 216 si numéro local à 8 chiffres). */
    static String normPhone(String s) {
        if (!notBlank(s)) return null;
        String d = s.replaceAll("\\D", "");
        if (d.startsWith("00")) d = d.substring(2);
        if (d.length() == 8) d = "216" + d;
        return d.isEmpty() ? null : d;
    }

    private static List<String> hashList(String v) {
        return v == null ? null : List.of(sha256(v));
    }

    static String sha256(String v) {
        try {
            byte[] h = MessageDigest.getInstance("SHA-256").digest(v.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : h) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception ex) {
            throw new IllegalStateException(ex);
        }
    }

    /** Sépare « Prénom Nom » pour fn/ln. */
    public static String[] splitName(String full) {
        if (!notBlank(full)) return new String[]{null, null};
        String[] p = full.trim().split("\\s+", 2);
        return new String[]{p[0], p.length > 1 ? p[1] : null};
    }
}
