package com.luxart.ecommerce.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StorefrontCheckoutRequest {

    @NotBlank
    private String visitorKey;

    private String nom;

    /** Compte client inscrit (fidélité) — prioritaire sur visitorKey */
    private Long clientUserId;

    @NotBlank
    private String adresseLivraison;

    /** Téléphone client (affiché dans le détail commande admin) */
    private String telephone;

    @NotEmpty
    @Valid
    private List<CheckoutLineItem> items;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CheckoutLineItem {
        @NotNull
        private Long productId;

        @NotNull
        @Positive
        private Integer quantite;

        @NotNull
        @Positive
        private BigDecimal prixUnitaire;
    }
}
