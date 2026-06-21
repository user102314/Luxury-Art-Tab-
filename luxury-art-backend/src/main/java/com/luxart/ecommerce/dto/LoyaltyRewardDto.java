package com.luxart.ecommerce.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoyaltyRewardDto {
    private Long id;
    private Long clientProfileId;
    private String clientNom;
    private String programmeNom;
    private String typeRecompense;
    private BigDecimal valeurRecompense;
    private String message;
    private LocalDateTime earnedAt;
}
