package com.luxart.ecommerce.dto;

import com.luxart.ecommerce.model.enums.OrderCanal;
import com.luxart.ecommerce.model.enums.OrderStatut;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderDto {

    private Long id;

    @NotNull
    private Long userId;

    private String userNom;

    private LocalDateTime dateCommande;

    @NotNull
    private OrderStatut statut;

    private BigDecimal total;

    @NotBlank
    private String adresseLivraison;

    private OrderCanal canal;

    private String clientNom;

    private String clientTelephone;

    private String referenceFacebook;

    private String referenceInstagram;

    private String referenceWhatsapp;

    private String numeroColis;

    private String colissimoCodeBarre;

    private String colissimoReference;

    private String colissimoEtat;

    private String colissimoDesignation;

    private LocalDateTime colissimoImportedAt;

    private List<OrderItemDto> items;
}
