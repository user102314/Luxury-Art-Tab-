package com.luxart.ecommerce.repository;

import com.luxart.ecommerce.model.entity.ProductComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductCommentRepository extends JpaRepository<ProductComment, Long> {
    List<ProductComment> findByProductIdOrderByCreatedAtDesc(Long productId);
    List<ProductComment> findByUserId(Long userId);
}
