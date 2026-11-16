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

    /** Token d'ajout fourni par Colissimo (espace client) */
    private String tokenAjout = "lat-UT20SYIJ5E3AORJRQ31RX35NIAWEYK55";

    /** Token de tracking fourni par Colissimo (espace client) */
    private String tokenTracking = "lat-etat-UT20SYIJ5E3AORJRQ31RX35NIAWEYK55";

    /** URL API d'ajout colissimodelivery.tn */
    private String restPostUrl = "https://colissimodelivery.tn/api/v1/post.php";

    /** URL API d'état colissimodelivery.tn */
    private String restEtatUrl = "https://colissimodelivery.tn/api/v1/etat.php";

    /** URL impression bordereau colissimodelivery.tn */
    private String restPrintUrl = "https://colissimodelivery.tn/print/imprimer.php?code=";

    private String endpoint = "https://delivery.colissimo.com.tn/wsColissimoGo/wsColissimoGo.asmx";

    /** Intervalle entre deux synchronisations automatiques (ms). Défaut: 5 min. */
    private long syncIntervalMs = 300_000L;

    /** Délai avant la première sync au démarrage (ms). */
    private long syncInitialDelayMs = 30_000L;
}
