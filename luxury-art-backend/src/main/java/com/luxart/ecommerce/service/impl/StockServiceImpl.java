package com.luxart.ecommerce.service.impl;

import com.luxart.ecommerce.exception.ResourceNotFoundException;
import com.luxart.ecommerce.model.entity.Product;
import com.luxart.ecommerce.model.enums.ProductStatut;
import com.luxart.ecommerce.repository.ProductRepository;
import com.luxart.ecommerce.service.StockService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class StockServiceImpl implements StockService {

    private final ProductRepository productRepository;

    @Override
    @Transactional
    public void decreaseStock(Long productId, int quantity) {
        Product product = getProductOrThrow(productId);
        if (product.getStock() < quantity) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Stock insuffisant pour « " + product.getNom() + " » (reste: " + product.getStock() + ")");
        }
        product.setStock(product.getStock() - quantity);
        if (product.getStock() == 0 && product.getStatut() == ProductStatut.DISPONIBLE) {
            product.setStatut(ProductStatut.RUPTURE_STOCK);
        }
        productRepository.save(product);
    }

    @Override
    @Transactional
    public void increaseStock(Long productId, int quantity) {
        Product product = getProductOrThrow(productId);
        product.setStock(product.getStock() + quantity);
        if (product.getStock() > 0 && product.getStatut() == ProductStatut.RUPTURE_STOCK) {
            product.setStatut(ProductStatut.DISPONIBLE);
        }
        productRepository.save(product);
    }

    @Override
    public Product getProductOrThrow(Long productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable: " + productId));
    }
}
