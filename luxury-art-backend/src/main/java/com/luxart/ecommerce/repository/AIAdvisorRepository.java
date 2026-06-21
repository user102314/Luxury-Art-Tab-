package com.luxart.ecommerce.repository;

import com.luxart.ecommerce.model.entity.AIAdvisor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AIAdvisorRepository extends JpaRepository<AIAdvisor, Long> {
}
