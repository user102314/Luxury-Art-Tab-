package com.luxart.ecommerce.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminNotificationDto {
    private Long id;
    private String type;
    private String title;
    private String message;
    private Long orderId;
    private String canal;
    private String clientNom;
    private java.math.BigDecimal total;
    private String createdAt;
    private Boolean read;
    private String clientTelephone;
    private String colissimoCodeBarre;
    private String colissimoEtat;
    private String statut;
    private String adresseLivraison;
    private String colissimoDesignation;
    private String reference;
}
