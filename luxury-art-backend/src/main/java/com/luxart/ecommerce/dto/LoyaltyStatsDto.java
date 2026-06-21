package com.luxart.ecommerce.dto;

import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoyaltyStatsDto {
    private long totalClients;
    private long totalRecompenses;
    private long totalCommandesLivreesClients;
    private BigDecimal totalReductionsAccordees;
    private long tableauxGratuitsAccordes;
    private LoyaltyProgramDto programmeActif;
}
