package com.luxart.ecommerce.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductStatsDto {

    private Long productId;
    private String productName;
    private long totalViews;
    private long totalClicks;
    private long totalAddToCart;
    private long totalSales;
    private BigDecimal revenue;
    private double conversionRate;
}
