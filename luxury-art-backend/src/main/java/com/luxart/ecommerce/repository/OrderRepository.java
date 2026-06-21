package com.luxart.ecommerce.repository;

import com.luxart.ecommerce.model.entity.Order;
import com.luxart.ecommerce.model.enums.OrderCanal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserId(Long userId);
    List<Order> findByCanalOrderByDateCommandeDesc(OrderCanal canal);
}
