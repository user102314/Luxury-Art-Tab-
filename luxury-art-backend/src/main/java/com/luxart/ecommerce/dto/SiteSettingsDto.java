package com.luxart.ecommerce.dto;

import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SiteSettingsDto {
    private Integer termsVersion;
    private String termsContent;
    private String whatsappNumber;
    private List<SupportFaqItem> supportFaq;
}
