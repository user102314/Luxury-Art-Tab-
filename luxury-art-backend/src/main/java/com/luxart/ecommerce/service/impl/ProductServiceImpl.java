package com.luxart.ecommerce.service.impl;

import com.luxart.ecommerce.dto.ProductDto;
import com.luxart.ecommerce.dto.ProductImageDto;
import com.luxart.ecommerce.exception.ResourceNotFoundException;
import com.luxart.ecommerce.model.entity.Category;
import com.luxart.ecommerce.model.entity.Product;
import com.luxart.ecommerce.repository.CategoryRepository;
import com.luxart.ecommerce.repository.ProductImageRepository;
import com.luxart.ecommerce.repository.ProductRepository;
import com.luxart.ecommerce.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductImageRepository productImageRepository;

    @Override
    public List<ProductDto> findAll() {
        return productRepository.findAll().stream().map(this::toDto).toList();
    }

    @Override
    public ProductDto findById(Long id) {
        return toDto(getEntity(id));
    }

    @Override
    public ProductDto create(ProductDto dto) {
        Product product = Product.builder()
                .nom(dto.getNom())
                .description(dto.getDescription())
                .prix(dto.getPrix())
                .stock(dto.getStock())
                .categorie(getCategory(dto.getCategoryId()))
                .statut(dto.getStatut())
                .build();
        return toDto(productRepository.save(product));
    }

    @Override
    public ProductDto update(Long id, ProductDto dto) {
        Product product = getEntity(id);
        product.setNom(dto.getNom());
        product.setDescription(dto.getDescription());
        product.setPrix(dto.getPrix());
        product.setStock(dto.getStock());
        product.setCategorie(getCategory(dto.getCategoryId()));
        product.setStatut(dto.getStatut());
        return toDto(productRepository.save(product));
    }

    @Override
    public void delete(Long id) {
        productRepository.delete(getEntity(id));
    }

    private Product getEntity(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable: " + id));
    }

    private Category getCategory(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Catégorie introuvable: " + id));
    }

    private ProductDto toDto(Product product) {
        List<ProductImageDto> images = productImageRepository
                .findByProductIdOrderByOrdreAsc(product.getId())
                .stream()
                .map(img -> ProductImageDto.builder()
                        .id(img.getId())
                        .productId(product.getId())
                        .url(img.getUrl())
                        .storagePath(img.getStoragePath())
                        .ordre(img.getOrdre())
                        .createdAt(img.getCreatedAt())
                        .build())
                .toList();

        return ProductDto.builder()
                .id(product.getId())
                .nom(product.getNom())
                .description(product.getDescription())
                .prix(product.getPrix())
                .stock(product.getStock())
                .imageUrl(images.isEmpty() ? product.getImageUrl() : images.get(0).getUrl())
                .images(images)
                .categoryId(product.getCategorie() != null ? product.getCategorie().getId() : null)
                .statut(product.getStatut())
                .build();
    }
}
