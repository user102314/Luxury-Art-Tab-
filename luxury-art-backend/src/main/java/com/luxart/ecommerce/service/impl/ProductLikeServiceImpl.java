package com.luxart.ecommerce.service.impl;

import com.luxart.ecommerce.dto.ProductLikeDto;
import com.luxart.ecommerce.dto.ProductLikeSummaryDto;
import com.luxart.ecommerce.exception.ResourceNotFoundException;
import com.luxart.ecommerce.model.entity.Product;
import com.luxart.ecommerce.model.entity.ProductLike;
import com.luxart.ecommerce.model.entity.User;
import com.luxart.ecommerce.repository.ProductLikeRepository;
import com.luxart.ecommerce.repository.ProductRepository;
import com.luxart.ecommerce.repository.UserRepository;
import com.luxart.ecommerce.service.ProductLikeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductLikeServiceImpl implements ProductLikeService {

    private final ProductLikeRepository productLikeRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Override
    public ProductLikeSummaryDto getSummary(Long productId, Long userId) {
        ensureProductExists(productId);
        boolean userLiked = userId != null
                && productLikeRepository.findByUserIdAndProductId(userId, productId).isPresent();
        return ProductLikeSummaryDto.builder()
                .count(productLikeRepository.countByProductId(productId))
                .userLiked(userLiked)
                .build();
    }

    @Override
    public List<ProductLikeDto> findByProductId(Long productId) {
        ensureProductExists(productId);
        return productLikeRepository.findByProductIdOrderByCreatedAtDesc(productId).stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    public ProductLikeDto like(Long productId, Long userId) {
        Product product = getProduct(productId);
        User user = getUser(userId);

        if (productLikeRepository.findByUserIdAndProductId(userId, productId).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Produit déjà aimé");
        }

        ProductLike like = ProductLike.builder()
                .product(product)
                .user(user)
                .build();
        return toDto(productLikeRepository.save(like));
    }

    @Override
    public void unlike(Long productId, Long userId) {
        ensureProductExists(productId);
        if (!productLikeRepository.findByUserIdAndProductId(userId, productId).isPresent()) {
            throw new ResourceNotFoundException("Like introuvable pour ce produit");
        }
        productLikeRepository.deleteByUserIdAndProductId(userId, productId);
    }

    private void ensureProductExists(Long productId) {
        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Produit introuvable: " + productId);
        }
    }

    private Product getProduct(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable: " + id));
    }

    private User getUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable: " + id));
    }

    private ProductLikeDto toDto(ProductLike like) {
        return ProductLikeDto.builder()
                .id(like.getId())
                .userId(like.getUser().getId())
                .userNom(like.getUser().getNom())
                .productId(like.getProduct().getId())
                .createdAt(like.getCreatedAt())
                .build();
    }
}
