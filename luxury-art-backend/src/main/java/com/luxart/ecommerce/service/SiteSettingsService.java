package com.luxart.ecommerce.service;

import com.luxart.ecommerce.dto.SiteSettingsDto;

public interface SiteSettingsService {
    SiteSettingsDto getPublicSettings();
    SiteSettingsDto getSettings();
    SiteSettingsDto updateSettings(SiteSettingsDto dto);
}
