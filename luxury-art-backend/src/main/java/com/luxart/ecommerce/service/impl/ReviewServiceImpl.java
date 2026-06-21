package com.luxart.ecommerce.service.impl;

import com.luxart.ecommerce.dto.ReviewDto;
import com.luxart.ecommerce.exception.ResourceNotFoundException;
import com.luxart.ecommerce.model.entity.Product;
import com.luxart.ecommerce.model.entity.Review;
import com.luxart.ecommerce.model.entity.User;
import com.luxart.ecommerce.model.enums.ReviewStatut;
import com.luxart.ecommerce.repository.ProductRepository;
import com.luxart.ecommerce.repository.ReviewRepository;
import com.luxart.ecommerce.repository.UserRepository;
import com.luxart.ecommerce.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    @Override
    public List<ReviewDto> findAll() {
        return reviewRepository.findAll().stream().map(this::toDto).toList();
    }

    @Override
    public ReviewDto findById(Long id) {
        return toDto(getEntity(id));
    }

    @Override
    public ReviewDto create(ReviewDto dto) {
        Review review = Review.builder()
                .user(getUser(dto.getUserId()))
                .product(getProduct(dto.getProductId()))
                .note(dto.getNote())
                .commentaire(dto.getCommentaire())
                .statut(dto.getStatut() != null ? dto.getStatut() : ReviewStatut.EN_ATTENTE)
                .build();
        return toDto(reviewRepository.save(review));
    }

    @Override
    public ReviewDto update(Long id, ReviewDto dto) {
        Review review = getEntity(id);
        review.setUser(getUser(dto.getUserId()));
        review.setProduct(getProduct(dto.getProductId()));
        review.setNote(dto.getNote());
        review.setCommentaire(dto.getCommentaire());
        if (dto.getStatut() != null) {
            review.setStatut(dto.getStatut());
        }
        return toDto(reviewRepository.save(review));
    }

    @Override
    public void delete(Long id) {
        reviewRepository.delete(getEntity(id));
    }

    @Override
    public ReviewDto approuver(Long id) {
        Review review = getEntity(id);
        review.approuver();
        return toDto(reviewRepository.save(review));
    }

    @Override
    public List<ReviewDto> findApprovedByProductId(Long productId) {
        return reviewRepository
                .findByProductIdAndStatutOrderByCreatedAtDesc(productId, ReviewStatut.APPROUVE)
                .stream()
                .map(this::toDto)
                .toList();
    }

    private Review getEntity(Long id) {
        return reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Avis introuvable: " + id));
    }

    private User getUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable: " + id));
    }

    private Product getProduct(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable: " + id));
    }

    private ReviewDto toDto(Review review) {
        return ReviewDto.builder()
                .id(review.getId())
                .userId(review.getUser().getId())
                .productId(review.getProduct().getId())
                .note(review.getNote())
                .commentaire(review.getCommentaire())
                .createdAt(review.getCreatedAt())
                .statut(review.getStatut())
                .build();
    }
}
