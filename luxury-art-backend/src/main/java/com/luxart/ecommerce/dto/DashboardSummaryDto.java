package com.luxart.ecommerce.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardSummaryDto {

    private BigDecimal totalRevenue;
    private long totalOrders;
    private long totalActiveProducts;
    private BigDecimal averageOrderValue;
    private double conversionRate;

    @Builder.Default
    private List<ProductStatsDto> topProductsBySales = new ArrayList<>();

    @Builder.Default
    private List<ProductStatsDto> topProductsByViews = new ArrayList<>();
}
