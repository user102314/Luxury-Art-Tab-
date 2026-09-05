package com.luxart.ecommerce.service;

import com.luxart.ecommerce.dto.ProductDto;

import java.util.List;

public interface ProductService {
    List<ProductDto> findAll();
    ProductDto findById(Long id);
    ProductDto create(ProductDto dto);
    ProductDto update(Long id, ProductDto dto);
    ProductDto promote(Long id, boolean toFirst);
    /** Définit ce produit comme image hero de sa catégorie. */
    ProductDto setAsCategoryHero(Long id);
    void delete(Long id);
}
