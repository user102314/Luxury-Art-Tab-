package com.luxart.ecommerce.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TableauDimensionDto {
    private Long id;
    @NotBlank
    private String label;
    private Integer largeur;
    private Integer hauteur;
    private Integer ordre;
    /** Ex. « 3 » pour un format 3 pièces — optionnel */
    private String note;
}
