package com.luxart.ecommerce.colissimo;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "colissimo")
public class ColissimoProperties {

    private boolean enabled = false;

    private String utilisateur = "";

    private String pass = "";

    private String endpoint = "https://delivery.colissimo.com.tn/wsColissimoGo/wsColissimoGo.asmx";

    /** Intervalle entre deux synchronisations automatiques (ms). Défaut: 5 min. */
    private long syncIntervalMs = 300_000L;

    /** Délai avant la première sync au démarrage (ms). */
    private long syncInitialDelayMs = 30_000L;
}
