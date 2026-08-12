package com.luxart.ecommerce.service;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("local")
@TestPropertySource(properties = {
        "spring.config.additional-location=file:./src/main/resources/application-local.properties",
        "app.images.webp.migrate-existing=false",
        "app.images.webp.source-base-url=https://api.luxury-art.tn"
})
class ProductImageWebpMigrationIntegrationTest {

    @Autowired
    private ProductImageWebpMigrationService migrationService;

    @Test
    @Disabled("Migration one-shot — exécuter manuellement si besoin")
    void migrateExistingProductImagesToWebp() {
        ProductImageWebpMigrationService.MigrationResult result = migrationService.migrateAll();
        System.out.printf(
                "Migration WebP: converted=%d skipped=%d failed=%d fetchedRemotely=%d%n",
                result.converted(), result.skipped(), result.failed(), result.fetchedRemotely());
        assertTrue(result.converted() > 0 || result.skipped() > 0, "Aucune image traitée");
    }
}
