package com.luxart.ecommerce.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DimensionCadrePrixDto {
    private Long id;
    private Long dimensionId;
    private String dimensionLabel;
    private Long cadreId;
    private String cadreNom;
    private String cadreCode;
    private BigDecimal prix;
}
