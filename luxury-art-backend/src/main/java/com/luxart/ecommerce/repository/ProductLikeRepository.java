package com.luxart.ecommerce.repository;

import com.luxart.ecommerce.model.entity.ProductLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductLikeRepository extends JpaRepository<ProductLike, Long> {
    List<ProductLike> findByProductIdOrderByCreatedAtDesc(Long productId);
    long countByProductId(Long productId);
    Optional<ProductLike> findByUserIdAndProductId(Long userId, Long productId);
    void deleteByUserIdAndProductId(Long userId, Long productId);
}
