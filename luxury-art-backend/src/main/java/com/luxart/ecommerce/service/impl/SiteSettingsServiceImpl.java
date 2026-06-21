package com.luxart.ecommerce.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.luxart.ecommerce.dto.SiteSettingsDto;
import com.luxart.ecommerce.dto.SupportFaqItem;
import com.luxart.ecommerce.model.entity.SiteSettings;
import com.luxart.ecommerce.repository.SiteSettingsRepository;
import com.luxart.ecommerce.service.SiteSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SiteSettingsServiceImpl implements SiteSettingsService {

    private final SiteSettingsRepository repository;
    private final ObjectMapper objectMapper;

    @Override
    public SiteSettingsDto getPublicSettings() {
        return toDto(getOrCreate());
    }

    @Override
    public SiteSettingsDto getSettings() {
        return toDto(getOrCreate());
    }

    @Override
    @Transactional
    public SiteSettingsDto updateSettings(SiteSettingsDto dto) {
        SiteSettings settings = getOrCreate();
        if (dto.getTermsContent() != null) {
            settings.setTermsContent(dto.getTermsContent());
        }
        if (dto.getTermsVersion() != null) {
            settings.setTermsVersion(dto.getTermsVersion());
        }
        if (dto.getWhatsappNumber() != null) {
            settings.setWhatsappNumber(dto.getWhatsappNumber());
        }
        if (dto.getSupportFaq() != null) {
            settings.setSupportFaqJson(toJson(dto.getSupportFaq()));
        }
        return toDto(repository.save(settings));
    }

    private SiteSettings getOrCreate() {
        return repository.findAll().stream().findFirst().orElseGet(() ->
                repository.save(SiteSettings.builder()
                        .termsVersion(1)
                        .termsContent(defaultTerms())
                        .whatsappNumber("212600000000")
                        .supportFaqJson(toJson(defaultFaq()))
                        .build()));
    }

    private SiteSettingsDto toDto(SiteSettings s) {
        return SiteSettingsDto.builder()
                .termsVersion(s.getTermsVersion())
                .termsContent(s.getTermsContent())
                .whatsappNumber(s.getWhatsappNumber())
                .supportFaq(fromJson(s.getSupportFaqJson()))
                .build();
    }

    private List<SupportFaqItem> fromJson(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (JsonProcessingException e) {
            return defaultFaq();
        }
    }

    private String toJson(List<SupportFaqItem> items) {
        try {
            return objectMapper.writeValueAsString(items);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }

    private static String defaultTerms() {
        return """
                Règles d'utilisation — Luxury Art Tab

                1. En utilisant ce site, vous acceptez nos conditions générales de vente.
                2. Les commandes sont traitées sous 48h ouvrées.
                3. Le programme de fidélité récompense les clients inscrits après livraison confirmée.
                4. Les récompenses (tableaux gratuits ou réductions) sont personnelles et non transférables.
                5. Luxury Art Tab se réserve le droit de modifier le programme de fidélité.
                6. Pour toute question, contactez-nous via WhatsApp ou le chat support.
                """;
    }

    private static List<SupportFaqItem> defaultFaq() {
        return List.of(
                SupportFaqItem.builder().question("Quels sont les délais de livraison ?")
                        .answer("La livraison au Maroc prend généralement 3 à 7 jours ouvrés.").build(),
                SupportFaqItem.builder().question("Comment fonctionne la fidélité ?")
                        .answer("Créez un compte, commandez et gagnez des récompenses après vos commandes livrées.").build(),
                SupportFaqItem.builder().question("Puis-je personnaliser un tableau ?")
                        .answer("Oui, contactez-nous sur WhatsApp pour un tableau sur mesure.").build(),
                SupportFaqItem.builder().question("Quels moyens de paiement acceptez-vous ?")
                        .answer("Paiement à la livraison et virement bancaire.").build()
        );
    }
}
