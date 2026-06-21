package com.luxart.ecommerce.repository;

import com.luxart.ecommerce.model.entity.DashboardStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DashboardStatsRepository extends JpaRepository<DashboardStats, Long> {
}
