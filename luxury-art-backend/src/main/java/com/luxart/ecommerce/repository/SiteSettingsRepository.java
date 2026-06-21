package com.luxart.ecommerce.repository;

import com.luxart.ecommerce.model.entity.SiteSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SiteSettingsRepository extends JpaRepository<SiteSettings, Long> {
}
