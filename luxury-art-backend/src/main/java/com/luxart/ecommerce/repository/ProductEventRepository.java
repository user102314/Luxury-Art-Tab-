package com.luxart.ecommerce.repository;

import com.luxart.ecommerce.model.entity.ProductEvent;
import com.luxart.ecommerce.model.enums.ProductEventType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface ProductEventRepository extends JpaRepository<ProductEvent, Long> {

    @Query("""
            SELECT COUNT(e) FROM ProductEvent e
            WHERE e.product.id = :productId
              AND e.eventType = :eventType
              AND e.createdAt >= :from
              AND e.createdAt < :to
            """)
    long countByProductAndTypeAndPeriod(
            @Param("productId") Long productId,
            @Param("eventType") ProductEventType eventType,
            @Param("from") Instant from,
            @Param("to") Instant to);

    @Query("""
            SELECT COUNT(e) FROM ProductEvent e
            WHERE e.eventType = :eventType
              AND e.createdAt >= :from
              AND e.createdAt < :to
            """)
    long countByTypeAndPeriod(
            @Param("eventType") ProductEventType eventType,
            @Param("from") Instant from,
            @Param("to") Instant to);

    @Query("""
            SELECT e.product.id, COUNT(e)
            FROM ProductEvent e
            WHERE e.eventType = :eventType
              AND e.createdAt >= :from
              AND e.createdAt < :to
            GROUP BY e.product.id
            ORDER BY COUNT(e) DESC
            """)
    List<Object[]> findTopProductIdsByEventType(
            @Param("eventType") ProductEventType eventType,
            @Param("from") Instant from,
            @Param("to") Instant to,
            Pageable pageable);

    boolean existsByProductIdAndSessionIdAndEventTypeAndCreatedAtAfter(
            Long productId,
            String sessionId,
            ProductEventType eventType,
            Instant createdAtAfter);
}
