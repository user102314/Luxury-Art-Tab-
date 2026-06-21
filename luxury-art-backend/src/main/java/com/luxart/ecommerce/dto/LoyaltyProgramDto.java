package com.luxart.ecommerce.dto;

import com.luxart.ecommerce.model.enums.LoyaltyRewardType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoyaltyProgramDto {
    private Long id;
    @NotBlank
    private String nom;
    private String description;
    @NotNull
    @Min(1)
    private Integer commandesRequises;
    @NotNull
    private LoyaltyRewardType typeRecompense;
    @NotNull
    private BigDecimal valeurRecompense;
    private Boolean actif;
    private LocalDateTime createdAt;
}
