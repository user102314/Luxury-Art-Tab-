package com.luxart.ecommerce.repository;

import com.luxart.ecommerce.model.entity.OrderItem;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    List<OrderItem> findByOrderId(Long orderId);

    @Query("""
            SELECT oi.product.id,
                   oi.product.nom,
                   COALESCE(SUM(oi.quantite), 0),
                   COALESCE(SUM(oi.prixUnitaire * oi.quantite), 0)
            FROM OrderItem oi
            WHERE oi.order.dateCommande >= :from
              AND oi.order.dateCommande < :to
              AND oi.order.statut <> com.luxart.ecommerce.model.enums.OrderStatut.ANNULEE
            GROUP BY oi.product.id, oi.product.nom
            ORDER BY SUM(oi.quantite) DESC
            """)
    List<Object[]> findTopProductsBySales(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            Pageable pageable);

    @Query("""
            SELECT COALESCE(SUM(oi.quantite), 0),
                   COALESCE(SUM(oi.prixUnitaire * oi.quantite), 0)
            FROM OrderItem oi
            WHERE oi.product.id = :productId
              AND oi.order.dateCommande >= :from
              AND oi.order.dateCommande < :to
              AND oi.order.statut <> com.luxart.ecommerce.model.enums.OrderStatut.ANNULEE
            """)
    List<Object[]> findSalesAndRevenueForProduct(
            @Param("productId") Long productId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);
}
