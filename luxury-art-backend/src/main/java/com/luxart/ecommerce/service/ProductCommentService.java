package com.luxart.ecommerce.service;

import com.luxart.ecommerce.dto.ProductCommentDto;

import java.util.List;

public interface ProductCommentService {
    List<ProductCommentDto> findAll();
    ProductCommentDto findById(Long id);
    List<ProductCommentDto> findByProductId(Long productId);
    ProductCommentDto create(ProductCommentDto dto);
    ProductCommentDto update(Long id, ProductCommentDto dto);
    void delete(Long id);
}
