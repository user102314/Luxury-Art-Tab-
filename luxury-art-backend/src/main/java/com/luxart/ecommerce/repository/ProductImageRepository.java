package com.luxart.ecommerce.repository;

import com.luxart.ecommerce.model.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {
    List<ProductImage> findByProductIdOrderByOrdreAsc(Long productId);

    @Query("""
            SELECT pi FROM ProductImage pi
            JOIN pi.product p
            WHERE p.id IN :productIds
            ORDER BY p.id ASC, pi.ordre ASC
            """)
    List<ProductImage> findByProductIdIn(@Param("productIds") Collection<Long> productIds);

    void deleteByProductId(Long productId);
}
