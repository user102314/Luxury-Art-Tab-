package com.luxart.ecommerce.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItemDto {

    private Long id;

    @NotNull
    private Long orderId;

    @NotNull
    private Long productId;

    private String productNom;

    @NotNull
    @Positive
    private Integer quantite;

    @NotNull
    @Positive
    private BigDecimal prixUnitaire;
}
