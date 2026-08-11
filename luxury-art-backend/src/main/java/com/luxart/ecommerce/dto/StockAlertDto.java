package com.luxart.ecommerce.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockAlertDto {
    private Long productId;
    private String ref;
    private Integer stock;
    private String statut;
    private String imageUrl;
}
