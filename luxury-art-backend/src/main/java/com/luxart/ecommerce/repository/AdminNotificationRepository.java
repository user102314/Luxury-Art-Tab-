package com.luxart.ecommerce.repository;

import com.luxart.ecommerce.model.entity.AdminNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdminNotificationRepository extends JpaRepository<AdminNotification, Long> {

    List<AdminNotification> findTop100ByOrderByCreatedAtDesc();

    long countByReadFalse();
}
