package com.luxart.ecommerce.service;

import com.luxart.ecommerce.model.entity.Product;
import com.luxart.ecommerce.model.entity.ProductImage;
import com.luxart.ecommerce.repository.ProductImageRepository;
import com.luxart.ecommerce.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductImageWebpMigrationService {

    private final ProductImageRepository productImageRepository;
    private final ProductRepository productRepository;
    private final LocalFileStorageService localFileStorageService;
    private final ImageConversionService imageConversionService;
    private final RemoteImageFetchService remoteImageFetchService;

    public record MigrationResult(int converted, int skipped, int failed, int fetchedRemotely) {}

    @Transactional
    public MigrationResult migrateAll() {
        List<ProductImage> images = productImageRepository.findAll();
        int converted = 0;
        int skipped = 0;
        int failed = 0;
        int fetchedRemotely = 0;

        for (ProductImage image : images) {
            try {
                MigrationStep step = migrateImage(image);
                switch (step.outcome()) {
                    case CONVERTED -> converted++;
                    case SKIPPED -> skipped++;
                }
                if (step.fetchedRemotely()) {
                    fetchedRemotely++;
                }
            } catch (Exception ex) {
                failed++;
                log.error("Échec migration WebP image id={} path={}: {}",
                        image.getId(), image.getStoragePath(), ex.getMessage());
            }
        }

        syncAllProductPrimaryImages();
        return new MigrationResult(converted, skipped, failed, fetchedRemotely);
    }

    private record MigrationStep(Outcome outcome, boolean fetchedRemotely) {}

    private enum Outcome { CONVERTED, SKIPPED }

    private MigrationStep migrateImage(ProductImage image) {
        String oldPath = image.getStoragePath();
        if (isWebp(oldPath)) {
            return new MigrationStep(Outcome.SKIPPED, false);
        }

        boolean fetchedRemotely = false;
        byte[] original;
        if (localFileStorageService.exists(oldPath)) {
            original = localFileStorageService.read(oldPath);
        } else {
            var remoteBytes = remoteImageFetchService.fetch(image.getUrl());
            if (remoteBytes.isEmpty()) {
                log.warn("Fichier introuvable, image ignorée id={} path={}", image.getId(), oldPath);
                return new MigrationStep(Outcome.SKIPPED, false);
            }
            original = remoteBytes.get();
            fetchedRemotely = true;
        }

        ImageConversionService.ConvertedImage converted = imageConversionService.convertToWebp(
                original, guessContentType(oldPath));

        String newPath = localFileStorageService.toWebpStoragePath(oldPath);
        String newUrl = localFileStorageService.upload(
                newPath, converted.data(), converted.contentType());

        String oldUrl = image.getUrl();
        image.setStoragePath(newPath);
        image.setUrl(newUrl);
        productImageRepository.save(image);

        if (localFileStorageService.exists(oldPath)) {
            localFileStorageService.delete(oldPath);
        }
        updateProductImageUrlIfNeeded(image.getProduct().getId(), oldUrl, newUrl);

        log.info("Image produit convertie en WebP id={} : {} -> {}{}",
                image.getId(), oldPath, newPath, fetchedRemotely ? " (téléchargée)" : "");
        return new MigrationStep(Outcome.CONVERTED, fetchedRemotely);
    }

    private void updateProductImageUrlIfNeeded(Long productId, String oldUrl, String newUrl) {
        productRepository.findById(productId).ifPresent(product -> {
            if (Objects.equals(product.getImageUrl(), oldUrl)) {
                product.setImageUrl(newUrl);
                productRepository.save(product);
            }
        });
    }

    private void syncAllProductPrimaryImages() {
        for (Product product : productRepository.findAll()) {
            List<ProductImage> images = productImageRepository
                    .findByProductIdOrderByOrdreAsc(product.getId());
            String primaryUrl = images.isEmpty() ? null : images.get(0).getUrl();
            if (!Objects.equals(product.getImageUrl(), primaryUrl)) {
                product.setImageUrl(primaryUrl);
                productRepository.save(product);
            }
        }
    }

    private static boolean isWebp(String storagePath) {
        return storagePath != null && storagePath.toLowerCase().endsWith(".webp");
    }

    private static String guessContentType(String path) {
        String lower = path.toLowerCase();
        if (lower.endsWith(".png")) {
            return "image/png";
        }
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
            return "image/jpeg";
        }
        if (lower.endsWith(".gif")) {
            return "image/gif";
        }
        if (lower.endsWith(".bmp")) {
            return "image/bmp";
        }
        if (lower.endsWith(".webp")) {
            return "image/webp";
        }
        return "image/jpeg";
    }
}
