package com.luxart.ecommerce.dto;

import com.luxart.ecommerce.model.enums.ProductStatut;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
    private String ref;

    private String description;

    /** Prix de départ (min des tarifs des dimensions sélectionnées) */
    private BigDecimal prix;

    private List<Long> dimensionIds;

    private List<TableauDimensionDto> dimensions;

    /** URL de la première image (compatibilité) */
    private String imageUrl;

    private List<ProductImageDto> images;

    @NotNull
    private Long categoryId;

    @NotNull
    private ProductStatut statut;
}
