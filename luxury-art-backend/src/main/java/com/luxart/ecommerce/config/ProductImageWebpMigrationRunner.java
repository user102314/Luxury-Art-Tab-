package com.luxart.ecommerce.config;

import com.luxart.ecommerce.service.ProductImageWebpMigrationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(50)
@RequiredArgsConstructor
@Slf4j
public class ProductImageWebpMigrationRunner implements CommandLineRunner {

    private final ProductImageWebpMigrationService migrationService;

    @Value("${app.images.webp.migrate-existing:true}")
    private boolean migrateExisting;

    @Override
    public void run(String... args) {
        if (!migrateExisting) {
            log.debug("Migration WebP images produit désactivée");
            return;
        }

        ProductImageWebpMigrationService.MigrationResult result = migrationService.migrateAll();
        if (result.converted() > 0 || result.failed() > 0) {
            log.info("Migration WebP images produit terminée : {} converties ({} téléchargées), {} déjà WebP/absentes, {} échecs",
                    result.converted(), result.fetchedRemotely(), result.skipped(), result.failed());
        }
    }
}
