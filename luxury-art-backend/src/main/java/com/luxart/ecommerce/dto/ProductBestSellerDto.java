package com.luxart.ecommerce.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductBestSellerDto {

    private Long productId;
    private String nom;
    private Long quantiteVendue;
    private BigDecimal chiffreAffaires;
}
