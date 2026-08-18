package com.luxart.ecommerce.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CadreCouleurDto {
    private Long id;
    private Long cadreId;
    @NotBlank
    private String nom;
    private String hex;
    private String imageUrl;
    private Integer ordre;
}
