package com.luxart.ecommerce.dto;

import com.luxart.ecommerce.model.enums.OrderStatut;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InstagramOrderCreateDto {

    @NotBlank
    private String clientNom;

    private String clientEmail;

    private String clientTelephone;

    @NotBlank
    private String adresseLivraison;

    private String referenceInstagram;

    @Builder.Default
    private OrderStatut statut = OrderStatut.EN_ATTENTE;

    @NotEmpty
    @Valid
    private List<LineItem> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LineItem {
        @NotNull
        private Long productId;

        @NotNull
        @Positive
        private Integer quantite;

        /** Si null, prix catalogue du produit */
        private BigDecimal prixUnitaire;
    }
}
