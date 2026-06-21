package com.luxart.ecommerce.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientProfileDto {
    private Long id;
    private Long userId;
    private String nom;
    private String email;
    private String telephone;
    private Integer commandesCycle;
    private Integer totalCommandesLivrees;
    private Integer totalRecompenses;
    private Integer tableauxGratuits;
    private BigDecimal reductionDisponible;
    private Integer commandesRequises;
    private String programmeNom;
    private String typeRecompense;
    private BigDecimal valeurRecompense;
    private LocalDateTime termsAcceptedAt;
    private LocalDateTime createdAt;
}
