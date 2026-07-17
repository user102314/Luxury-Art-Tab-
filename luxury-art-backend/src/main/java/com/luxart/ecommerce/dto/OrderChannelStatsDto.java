package com.luxart.ecommerce.dto;

import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderChannelStatsDto {
    private long totalFacebook;
    private long totalInstagram;
    private long totalWhatsapp;
    private long totalSiteWeb;
    private long facebookLivrees;
    private long instagramLivrees;
    private long whatsappLivrees;
    private long siteWebLivrees;
    private BigDecimal caFacebook;
    private BigDecimal caInstagram;
    private BigDecimal caWhatsapp;
    private BigDecimal caSiteWeb;
    private BigDecimal caTotal;
}
