package com.luxart.ecommerce.colissimo.dto;

import com.luxart.ecommerce.model.enums.OrderCanal;
import com.luxart.ecommerce.model.enums.OrderStatut;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ColissimoTrackingSummaryDto {

    private Long orderId;
    private OrderStatut orderStatut;
    private OrderCanal canal;
    private String clientNom;
    private LocalDateTime dateCommande;

    private String codeBarre;
    private String etat;
    private String etatLabel;
    private String agenceActuelle;
    private String designation;
}
