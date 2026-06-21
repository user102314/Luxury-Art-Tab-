package com.luxart.ecommerce.repository;

import com.luxart.ecommerce.model.entity.LoyaltyReward;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LoyaltyRewardRepository extends JpaRepository<LoyaltyReward, Long> {
    List<LoyaltyReward> findTop20ByOrderByEarnedAtDesc();
    List<LoyaltyReward> findByClientProfileIdOrderByEarnedAtDesc(Long clientProfileId);
}
