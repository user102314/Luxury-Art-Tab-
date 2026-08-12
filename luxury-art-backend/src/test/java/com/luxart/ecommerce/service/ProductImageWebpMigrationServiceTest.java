package com.luxart.ecommerce.service;

import com.luxart.ecommerce.model.entity.Product;
import com.luxart.ecommerce.model.entity.ProductImage;
import com.luxart.ecommerce.repository.ProductImageRepository;
import com.luxart.ecommerce.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.test.util.ReflectionTestUtils;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ProductImageWebpMigrationServiceTest {

    @TempDir
    Path tempDir;

    private ProductImageRepository productImageRepository;
    private ProductRepository productRepository;
    private LocalFileStorageService localFileStorageService;
    private ImageConversionService imageConversionService;
    private ProductImageWebpMigrationService migrationService;

    @BeforeEach
    void setUp() {
        productImageRepository = mock(ProductImageRepository.class);
        productRepository = mock(ProductRepository.class);
        localFileStorageService = new LocalFileStorageService(tempDir.toString());
        imageConversionService = new ImageConversionService(0.85f);
        RemoteImageFetchService remoteImageFetchService = new RemoteImageFetchService("");
        migrationService = new ProductImageWebpMigrationService(
                productImageRepository,
                productRepository,
                localFileStorageService,
                imageConversionService,
                remoteImageFetchService);
    }

    @Test
    void migratesJpegImageAndUpdatesDatabase() throws Exception {
        Product product = Product.builder().id(46L).build();
        String oldPath = "products/46/test-image.jpeg";
        Path oldFile = tempDir.resolve(oldPath);
        Files.createDirectories(oldFile.getParent());
        Files.write(oldFile, createJpeg());

        ProductImage image = ProductImage.builder()
                .id(1L)
                .product(product)
                .url("/uploads/" + oldPath)
                .storagePath(oldPath)
                .ordre(0)
                .build();

        when(productImageRepository.findAll()).thenReturn(List.of(image));
        when(productRepository.findAll()).thenReturn(List.of(product));
        when(productRepository.findById(46L)).thenReturn(Optional.of(product));

        ProductImageWebpMigrationService.MigrationResult result = migrationService.migrateAll();

        assertEquals(1, result.converted());
        assertEquals(0, result.failed());
        assertEquals(0, result.fetchedRemotely());
        assertTrue(image.getStoragePath().endsWith(".webp"));
        assertTrue(image.getUrl().endsWith(".webp"));
        assertFalse(Files.exists(oldFile));
        assertTrue(Files.exists(tempDir.resolve(image.getStoragePath())));
        verify(productImageRepository).save(image);
    }

    @Test
    void skipsAlreadyWebpImages() {
        ProductImage image = ProductImage.builder()
                .id(2L)
                .product(Product.builder().id(1L).build())
                .url("/uploads/products/1/already.webp")
                .storagePath("products/1/already.webp")
                .ordre(0)
                .build();

        when(productImageRepository.findAll()).thenReturn(List.of(image));
        when(productRepository.findAll()).thenReturn(List.of());

        ProductImageWebpMigrationService.MigrationResult result = migrationService.migrateAll();

        assertEquals(0, result.converted());
        assertEquals(1, result.skipped());
        verify(productImageRepository, never()).save(any());
    }

    private static byte[] createJpeg() throws Exception {
        BufferedImage image = new BufferedImage(40, 40, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();
        g.setColor(Color.ORANGE);
        g.fillRect(0, 0, 40, 40);
        g.dispose();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(image, "jpg", out);
        return out.toByteArray();
    }
}
