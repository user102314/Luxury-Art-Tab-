package com.luxart.ecommerce.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CadreDto {
    private Long id;
    @NotBlank
    private String nom;
    private String code;
    private Integer ordre;
    private List<CadreCouleurDto> couleurs;
}
