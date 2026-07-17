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
    private String boutiqueNom;
    private String slogan;
    private String emailContact;
    private String telephoneContact;
    private String adresse;
    private String ville;
    private String pays;
    private List<SupportFaqItem> supportFaq;
}
