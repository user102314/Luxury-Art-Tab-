package com.luxart.ecommerce.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AIAdvisorDto {

    private Long id;

    @NotBlank
    private String modelName;

    private String context;
    private String historique;
}
