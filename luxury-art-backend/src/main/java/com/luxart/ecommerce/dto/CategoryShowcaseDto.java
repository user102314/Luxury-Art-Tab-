package com.luxart.ecommerce.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryShowcaseDto {

    private Long categoryId;
    private String nom;
    private String description;
    private ProductDto product;
}
