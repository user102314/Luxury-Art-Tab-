package com.luxart.ecommerce.dto;

import com.luxart.ecommerce.model.enums.Role;
import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientAuthResponse {
    private Long id;
    private String nom;
    private String email;
    private Role role;
    private Long clientProfileId;
    private Integer commandesCycle;
    private Integer commandesRequises;
    private Integer tableauxGratuits;
    private BigDecimal reductionDisponible;
    private Integer totalRecompenses;
    private String programmeNom;
    private String typeRecompense;
}
