package com.luxart.ecommerce.controller;

import com.luxart.ecommerce.dto.SiteSettingsDto;
import com.luxart.ecommerce.service.SiteSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class SiteController {

    private final SiteSettingsService siteSettingsService;

    @GetMapping("/api/site/settings")
    public SiteSettingsDto getPublicSettings() {
        return siteSettingsService.getPublicSettings();
    }

    @GetMapping("/api/admin/site/settings")
    public SiteSettingsDto getSettings() {
        return siteSettingsService.getSettings();
    }

    @PutMapping("/api/admin/site/settings")
    public SiteSettingsDto updateSettings(@RequestBody SiteSettingsDto dto) {
        return siteSettingsService.updateSettings(dto);
    }
}
