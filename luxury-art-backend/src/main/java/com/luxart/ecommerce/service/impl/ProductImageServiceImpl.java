package com.luxart.ecommerce.service.impl;

import com.luxart.ecommerce.dto.ProductImageDto;
import com.luxart.ecommerce.exception.ResourceNotFoundException;
import com.luxart.ecommerce.model.entity.Product;
import com.luxart.ecommerce.model.entity.ProductImage;
import com.luxart.ecommerce.model.enums.AdminActionType;
import com.luxart.ecommerce.repository.ProductImageRepository;
import com.luxart.ecommerce.repository.ProductRepository;
import com.luxart.ecommerce.service.AdminAuditService;
import com.luxart.ecommerce.service.ImageConversionService;
import com.luxart.ecommerce.service.LocalFileStorageService;
import com.luxart.ecommerce.service.ProductImageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProductImageServiceImpl implements ProductImageService {

    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final LocalFileStorageService localFileStorageService;
    private final ImageConversionService imageConversionService;
    private final AdminAuditService adminAuditService;

    @Override
    public List<ProductImageDto> findByProductId(Long productId) {
        return productImageRepository.findByProductIdOrderByOrdreAsc(productId)
                .stream().map(this::toDto).toList();
    }

    @Override
    @Transactional
    public List<ProductImageDto> uploadImages(Long productId, MultipartFile[] files) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable: " + productId));

        if (files == null || files.length == 0) {
            ResponseStatusException ex = new ResponseStatusException(HttpStatus.BAD_REQUEST, "Aucun fichier fourni");
            adminAuditService.logFailure(
                    AdminActionType.PRODUCT_IMAGE_UPLOAD,
                    "PRODUCT_IMAGE",
                    productId,
                    product.getRef(),
                    categoryName(product),
                    null,
                    null,
                    Map.of("productId", productId, "fileCount", 0),
                    HttpStatus.BAD_REQUEST.value(),
                    ex.getReason()
            );
            throw ex;
        }

        int currentCount = productImageRepository.findByProductIdOrderByOrdreAsc(productId).size();
        List<ProductImageDto> uploaded = new ArrayList<>();

        for (int i = 0; i < files.length; i++) {
            MultipartFile file = files[i];
            if (file.isEmpty()) continue;

            String contentType = file.getContentType() != null ? file.getContentType() : "image/jpeg";
            if (!contentType.startsWith("image/")) {
                ResponseStatusException ex = new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Seules les images sont acceptées: " + file.getOriginalFilename());
                auditUploadFailure(product, file.getOriginalFilename(), ex);
                throw ex;
            }

            try {
                ImageConversionService.ConvertedImage converted =
                        imageConversionService.convertToWebp(file.getBytes(), contentType);

                String storagePath = localFileStorageService.buildStoragePath(productId, file.getOriginalFilename());
                String publicUrl = localFileStorageService.upload(
                        storagePath, converted.data(), converted.contentType());

                ProductImage image = ProductImage.builder()
                        .product(product)
                        .url(publicUrl)
                        .storagePath(storagePath)
                        .ordre(currentCount + i)
                        .build();

                ProductImageDto dto = toDto(productImageRepository.save(image));
                uploaded.add(dto);
                adminAuditService.logSuccess(
                        AdminActionType.PRODUCT_IMAGE_UPLOAD,
                        "PRODUCT_IMAGE",
                        productId,
                        product.getRef(),
                        categoryName(product),
                        dto.getUrl(),
                        dto.getStoragePath(),
                        Map.of(
                                "productId", productId,
                                "originalFilename", file.getOriginalFilename(),
                                "contentType", contentType,
                                "sizeBytes", file.getSize()
                        ),
                        dto,
                        HttpStatus.CREATED.value()
                );
            } catch (ResponseStatusException ex) {
                auditUploadFailure(product, file.getOriginalFilename(), ex);
                throw ex;
            } catch (Exception ex) {
                ResponseStatusException wrapped = new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "Erreur upload: " + ex.getMessage());
                auditUploadFailure(product, file.getOriginalFilename(), wrapped);
                throw wrapped;
            }
        }

        syncPrimaryImageUrl(product);
        return uploaded;
    }

    @Override
    @Transactional
    public void deleteImage(Long imageId) {
        ProductImage image = productImageRepository.findById(imageId)
                .orElseThrow(() -> new ResourceNotFoundException("Image introuvable: " + imageId));

        Product product = image.getProduct();
        String ref = product.getRef();
        String url = image.getUrl();
        String storagePath = image.getStoragePath();
        Long productId = product.getId();

        try {
            try {
                localFileStorageService.delete(image.getStoragePath());
            } catch (Exception ignored) {
                // continue DB delete even if file delete fails
            }
            productImageRepository.delete(image);
            syncPrimaryImageUrl(product);
            adminAuditService.logSuccess(
                    AdminActionType.PRODUCT_IMAGE_DELETE,
                    "PRODUCT_IMAGE",
                    productId,
                    ref,
                    categoryName(product),
                    url,
                    storagePath,
                    Map.of("imageId", imageId, "productId", productId),
                    Map.of("deleted", true, "imageId", imageId),
                    HttpStatus.NO_CONTENT.value()
            );
        } catch (RuntimeException ex) {
            adminAuditService.logFailure(
                    AdminActionType.PRODUCT_IMAGE_DELETE,
                    "PRODUCT_IMAGE",
                    productId,
                    ref,
                    categoryName(product),
                    url,
                    storagePath,
                    Map.of("imageId", imageId, "productId", productId),
                    HttpStatus.BAD_REQUEST.value(),
                    ex.getMessage()
            );
            throw ex;
        }
    }

    private void auditUploadFailure(Product product, String filename, ResponseStatusException ex) {
        adminAuditService.logFailure(
                AdminActionType.PRODUCT_IMAGE_UPLOAD,
                "PRODUCT_IMAGE",
                product.getId(),
                product.getRef(),
                categoryName(product),
                null,
                null,
                Map.of("productId", product.getId(), "originalFilename", filename),
                ex.getStatusCode().value(),
                ex.getReason()
        );
    }

    private String categoryName(Product product) {
        return product.getCategorie() != null ? product.getCategorie().getNom() : null;
    }

    private void syncPrimaryImageUrl(Product product) {
        List<ProductImage> images = productImageRepository.findByProductIdOrderByOrdreAsc(product.getId());
        product.setImageUrl(images.isEmpty() ? null : images.get(0).getUrl());
        productRepository.save(product);
    }

    private ProductImageDto toDto(ProductImage image) {
        return ProductImageDto.builder()
                .id(image.getId())
                .productId(image.getProduct().getId())
                .url(image.getUrl())
                .storagePath(image.getStoragePath())
                .ordre(image.getOrdre())
                .createdAt(image.getCreatedAt())
                .build();
    }
}
