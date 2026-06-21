package com.luxart.ecommerce.repository;

import com.luxart.ecommerce.model.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {
    List<ProductImage> findByProductIdOrderByOrdreAsc(Long productId);
    void deleteByProductId(Long productId);
}
