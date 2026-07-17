package com.luxart.ecommerce.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockAlertDto {
    private Long productId;
    private String nom;
    private Integer stock;
    private String statut;
    private String imageUrl;
}
