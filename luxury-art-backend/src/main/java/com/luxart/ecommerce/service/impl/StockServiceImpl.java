package com.luxart.ecommerce.service.impl;

import com.luxart.ecommerce.exception.ResourceNotFoundException;
import com.luxart.ecommerce.model.entity.Product;
import com.luxart.ecommerce.repository.ProductRepository;
import com.luxart.ecommerce.service.StockService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StockServiceImpl implements StockService {

    private final ProductRepository productRepository;

    @Override
    @Transactional
    public void decreaseStock(Long productId, int quantity) {
        getProductOrThrow(productId);
    }

    @Override
    @Transactional
    public void increaseStock(Long productId, int quantity) {
        getProductOrThrow(productId);
    }

    @Override
    public Product getProductOrThrow(Long productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable: " + productId));
    }
}
