package com.luxart.ecommerce.colissimo.dto;

import com.luxart.ecommerce.model.enums.OrderCanal;
import com.luxart.ecommerce.model.enums.OrderStatut;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ColissimoTrackingDto {

    private Long orderId;
    private OrderStatut orderStatut;
    private OrderCanal canal;
    private String clientNom;
    private String clientTelephone;
    private LocalDateTime dateCommande;

    private String codeBarre;
    private String reference;
    private String etat;
    private String etatLabel;

    /** Transporteur (Colissimo) */
    private String transporteur;

    /** Agence / point Colissimo en charge du colis */
    private String agenceActuelle;

    /** N° manifeste (tournée de livraison) */
    private String numManifeste;

    private String numPaiement;

    private String adresse;
    private String ville;
    private String gouvernorat;
    private String tel1;

    private String designation;
    private BigDecimal prix;
    private Integer nbPieces;
    private String dateCreation;
    private String type;
    private String commentaire;

    /** true si données fraîchement récupérées depuis l'API Colissimo */
    private boolean liveFromApi;

    private List<ColissimoTrackingStepDto> timeline;
}
