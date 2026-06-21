package com.luxart.ecommerce.service;

import com.luxart.ecommerce.model.entity.Product;

public interface StockService {
    void decreaseStock(Long productId, int quantity);
    void increaseStock(Long productId, int quantity);
    Product getProductOrThrow(Long productId);
}
