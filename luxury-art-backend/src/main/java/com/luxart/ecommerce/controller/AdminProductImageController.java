package com.luxart.ecommerce.controller;

import com.luxart.ecommerce.service.ProductImageWebpMigrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/product-images")
@RequiredArgsConstructor
public class AdminProductImageController {

    private final ProductImageWebpMigrationService migrationService;

    @PostMapping("/migrate-webp")
    public ResponseEntity<Map<String, Integer>> migrateToWebp() {
        ProductImageWebpMigrationService.MigrationResult result = migrationService.migrateAll();
        return ResponseEntity.ok(Map.of(
                "converted", result.converted(),
                "skipped", result.skipped(),
                "failed", result.failed(),
                "fetchedRemotely", result.fetchedRemotely()));
    }
}
