package com.luxart.ecommerce.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryDto {

    private Long id;

    @NotBlank
    private String nom;

    private String description;

    /** Produit affiché pour cette catégorie dans le hero. */
    private Long heroProductId;
}
