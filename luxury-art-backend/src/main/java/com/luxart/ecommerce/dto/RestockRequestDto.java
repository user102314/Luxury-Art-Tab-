package com.luxart.ecommerce.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RestockRequestDto {
    @NotNull
    @Min(1)
    private Integer quantite;
}
