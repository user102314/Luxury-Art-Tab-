package com.luxart.ecommerce.repository;

import com.luxart.ecommerce.model.entity.AdminAuditLog;
import com.luxart.ecommerce.model.enums.AdminActionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface AdminAuditLogRepository extends JpaRepository<AdminAuditLog, Long> {

    List<AdminAuditLog> findByCreatedAtBetweenOrderByCreatedAtDesc(Instant from, Instant to);

    @Query("""
            SELECT l.actionType, COUNT(l) FROM AdminAuditLog l
            WHERE l.createdAt >= :from AND l.createdAt <= :to
            GROUP BY l.actionType
            """)
    List<Object[]> countByActionType(@Param("from") Instant from, @Param("to") Instant to);

    @Query("""
            SELECT l.productRef, COUNT(l) FROM AdminAuditLog l
            WHERE l.createdAt >= :from AND l.createdAt <= :to
            AND l.actionType = :actionType
            AND l.productRef IS NOT NULL
            GROUP BY l.productRef
            HAVING COUNT(l) > 1
            ORDER BY COUNT(l) DESC
            """)
    List<Object[]> findDuplicateRefs(
            @Param("from") Instant from,
            @Param("to") Instant to,
            @Param("actionType") AdminActionType actionType
    );

    long countByCreatedAtBetweenAndSuccessFalse(Instant from, Instant to);
}
