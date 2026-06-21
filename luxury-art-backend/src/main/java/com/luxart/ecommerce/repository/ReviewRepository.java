package com.luxart.ecommerce.repository;

import com.luxart.ecommerce.model.entity.Review;
import com.luxart.ecommerce.model.enums.ReviewStatut;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByProductId(Long productId);
    List<Review> findByUserId(Long userId);
    List<Review> findByProductIdAndStatutOrderByCreatedAtDesc(Long productId, ReviewStatut statut);
}
