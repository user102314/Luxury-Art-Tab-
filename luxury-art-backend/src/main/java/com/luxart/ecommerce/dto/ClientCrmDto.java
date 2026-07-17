package com.luxart.ecommerce.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientCrmDto {
    private Long userId;
    private String nom;
    private String email;
    private String telephone;
    private LocalDateTime inscritLe;
    private long nombreCommandes;
    private long commandesLivrees;
    private BigDecimal totalDepense;
    private LocalDateTime derniereCommande;
    private List<String> canaux;
}
