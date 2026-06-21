package com.luxart.ecommerce.dto;

import com.luxart.ecommerce.model.enums.ProductStatut;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductDto {

    private Long id;

    @NotBlank
    private String nom;

    private String description;

    @NotNull
    @Positive
    private BigDecimal prix;

    @NotNull
    @Positive
    private Integer stock;

    /** URL de la première image (compatibilité) */
    private String imageUrl;

    private List<ProductImageDto> images;

    @NotNull
    private Long categoryId;

    @NotNull
    private ProductStatut statut;
}
