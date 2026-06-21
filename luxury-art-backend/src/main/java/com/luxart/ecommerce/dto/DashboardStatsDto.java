package com.luxart.ecommerce.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStatsDto {

    private Long id;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private Long totalCommandes;
    private BigDecimal chiffreAffaires;
    private BigDecimal profitBrut;
    private BigDecimal profitNet;
    private String topProduits;
}
