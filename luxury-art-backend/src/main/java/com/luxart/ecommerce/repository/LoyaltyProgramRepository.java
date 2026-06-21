package com.luxart.ecommerce.repository;

import com.luxart.ecommerce.model.entity.LoyaltyProgram;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LoyaltyProgramRepository extends JpaRepository<LoyaltyProgram, Long> {
    Optional<LoyaltyProgram> findFirstByActifTrue();
    List<LoyaltyProgram> findAllByOrderByCreatedAtDesc();
}
