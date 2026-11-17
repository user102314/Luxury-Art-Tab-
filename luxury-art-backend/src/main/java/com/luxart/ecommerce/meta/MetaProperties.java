package com.luxart.ecommerce.meta;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

/** Configuration Meta Pixel / API de conversions (CAPI). Le token vient de l'environnement. */
@Getter
@Setter
@ConfigurationProperties(prefix = "meta")
public class MetaProperties {

    /** Active l'envoi serveur vers Meta (désactivé si pixel/token manquants). */
    private boolean enabled = true;

    private String pixelId = "1169653052791772";

    /** Jeton d'accès CAPI — JAMAIS en dur : variable META_CAPI_TOKEN. */
    private String capiToken = "";

    /** Code « Tester les événements » (vide en production). */
    private String testEventCode = "";

    private String apiVersion = "v21.0";

    private String siteUrl = "https://luxury-art.tn";

    private String currency = "TND";

    public boolean isReady() {
        return enabled && pixelId != null && !pixelId.isBlank()
                && capiToken != null && !capiToken.isBlank();
    }
}
