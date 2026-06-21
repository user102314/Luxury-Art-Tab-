package com.luxart.ecommerce.service.impl;

import com.luxart.ecommerce.dto.ProductCommentDto;
import com.luxart.ecommerce.exception.ResourceNotFoundException;
import com.luxart.ecommerce.model.entity.Product;
import com.luxart.ecommerce.model.entity.ProductComment;
import com.luxart.ecommerce.model.entity.User;
import com.luxart.ecommerce.model.enums.CommentStatut;
import com.luxart.ecommerce.repository.ProductCommentRepository;
import com.luxart.ecommerce.repository.ProductRepository;
import com.luxart.ecommerce.repository.UserRepository;
import com.luxart.ecommerce.service.ProductCommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductCommentServiceImpl implements ProductCommentService {

    private final ProductCommentRepository productCommentRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    @Override
    public List<ProductCommentDto> findAll() {
        return productCommentRepository.findAll().stream().map(this::toDto).toList();
    }

    @Override
    public ProductCommentDto findById(Long id) {
        return toDto(getEntity(id));
    }

    @Override
    public List<ProductCommentDto> findByProductId(Long productId) {
        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Produit introuvable: " + productId);
        }
        return productCommentRepository.findByProductIdOrderByCreatedAtDesc(productId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    public ProductCommentDto create(ProductCommentDto dto) {
        ProductComment comment = ProductComment.builder()
                .user(getUser(dto.getUserId()))
                .product(getProduct(dto.getProductId()))
                .contenu(dto.getContenu())
                .statut(dto.getStatut() != null ? dto.getStatut() : CommentStatut.APPROUVE)
                .build();
        return toDto(productCommentRepository.save(comment));
    }

    @Override
    public ProductCommentDto update(Long id, ProductCommentDto dto) {
        ProductComment comment = getEntity(id);
        comment.setContenu(dto.getContenu());
        if (dto.getStatut() != null) {
            comment.setStatut(dto.getStatut());
        }
        return toDto(productCommentRepository.save(comment));
    }

    @Override
    public void delete(Long id) {
        productCommentRepository.delete(getEntity(id));
    }

    private ProductComment getEntity(Long id) {
        return productCommentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Commentaire introuvable: " + id));
    }

    private User getUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable: " + id));
    }

    private Product getProduct(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable: " + id));
    }

    private ProductCommentDto toDto(ProductComment comment) {
        return ProductCommentDto.builder()
                .id(comment.getId())
                .userId(comment.getUser().getId())
                .userNom(comment.getUser().getNom())
                .productId(comment.getProduct().getId())
                .contenu(comment.getContenu())
                .createdAt(comment.getCreatedAt())
                .statut(comment.getStatut())
                .build();
    }
}
