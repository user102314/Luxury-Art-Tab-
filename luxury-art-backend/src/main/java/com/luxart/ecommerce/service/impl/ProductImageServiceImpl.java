package com.luxart.ecommerce.service.impl;

import com.luxart.ecommerce.dto.ProductImageDto;
import com.luxart.ecommerce.exception.ResourceNotFoundException;
import com.luxart.ecommerce.model.entity.Product;
import com.luxart.ecommerce.model.entity.ProductImage;
import com.luxart.ecommerce.repository.ProductImageRepository;
import com.luxart.ecommerce.repository.ProductRepository;
import com.luxart.ecommerce.service.ProductImageService;
import com.luxart.ecommerce.service.SupabaseStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductImageServiceImpl implements ProductImageService {

    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final SupabaseStorageService supabaseStorageService;

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
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Aucun fichier fourni");
        }

        int currentCount = productImageRepository.findByProductIdOrderByOrdreAsc(productId).size();
        List<ProductImageDto> uploaded = new ArrayList<>();

        for (int i = 0; i < files.length; i++) {
            MultipartFile file = files[i];
            if (file.isEmpty()) continue;

            String contentType = file.getContentType() != null ? file.getContentType() : "image/jpeg";
            if (!contentType.startsWith("image/")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Seules les images sont acceptées: " + file.getOriginalFilename());
            }

            try {
                String storagePath = supabaseStorageService.buildStoragePath(productId, file.getOriginalFilename());
                String publicUrl = supabaseStorageService.upload(storagePath, file.getBytes(), contentType);

                ProductImage image = ProductImage.builder()
                        .product(product)
                        .url(publicUrl)
                        .storagePath(storagePath)
                        .ordre(currentCount + i)
                        .build();

                uploaded.add(toDto(productImageRepository.save(image)));
            } catch (Exception ex) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "Erreur upload: " + ex.getMessage());
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
        try {
            supabaseStorageService.delete(image.getStoragePath());
        } catch (Exception ignored) {
            // continue DB delete even if storage delete fails
        }
        productImageRepository.delete(image);
        syncPrimaryImageUrl(product);
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
