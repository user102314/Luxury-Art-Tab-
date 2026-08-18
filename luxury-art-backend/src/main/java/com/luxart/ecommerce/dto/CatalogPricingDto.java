package com.luxart.ecommerce.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CatalogPricingDto {
    private List<TableauDimensionDto> dimensions;
    private List<CadreDto> cadres;
    private List<DimensionCadrePrixDto> tarifs;
}
