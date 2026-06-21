package com.luxart.ecommerce.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductAnalyticsDto {

    private Long productId;
    private String nom;
    private long nombreJaimes;
    private long nombreCommentaires;
    private long nombreAvis;
    private Double noteMoyenne;
    private long quantiteVendue;
    private BigDecimal chiffreAffaires;
    private List<ProductLikeDto> jaimes;
    private List<ProductCommentDto> commentaires;
}
