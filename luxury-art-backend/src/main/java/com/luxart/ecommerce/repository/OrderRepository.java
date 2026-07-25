package com.luxart.ecommerce.repository;

import com.luxart.ecommerce.model.entity.Order;
import com.luxart.ecommerce.model.enums.OrderCanal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserId(Long userId);
    List<Order> findByCanalOrderByDateCommandeDesc(OrderCanal canal);

    Optional<Order> findByColissimoCodeBarre(String colissimoCodeBarre);

    Optional<Order> findByNumeroColis(String numeroColis);

    @Query("""
            SELECT COUNT(o) FROM Order o
            WHERE o.dateCommande >= :from
              AND o.dateCommande < :to
              AND o.statut <> com.luxart.ecommerce.model.enums.OrderStatut.ANNULEE
            """)
    long countActiveInPeriod(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("""
            SELECT COALESCE(SUM(o.total), 0) FROM Order o
            WHERE o.dateCommande >= :from
              AND o.dateCommande < :to
              AND o.statut = com.luxart.ecommerce.model.enums.OrderStatut.LIVREE
            """)
    BigDecimal sumRevenueLivreeInPeriod(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("""
            SELECT o FROM Order o
            WHERE o.dateCommande >= :from
              AND o.dateCommande < :to
              AND o.statut = com.luxart.ecommerce.model.enums.OrderStatut.LIVREE
            ORDER BY o.dateCommande ASC
            """)
    List<Order> findLivreeInPeriod(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
}
