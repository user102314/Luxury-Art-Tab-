package com.luxart.ecommerce.dto;

import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderChannelStatsDto {
    private long totalFacebook;
    private long totalSiteWeb;
    private long facebookLivrees;
    private long siteWebLivrees;
    private BigDecimal caFacebook;
    private BigDecimal caSiteWeb;
    private BigDecimal caTotal;
}
