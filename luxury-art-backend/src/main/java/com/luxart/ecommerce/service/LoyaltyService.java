package com.luxart.ecommerce.service;

import com.luxart.ecommerce.dto.*;
import com.luxart.ecommerce.model.entity.Order;

import java.util.List;

public interface LoyaltyService {
    LoyaltyProgramDto getActiveProgram();
    List<LoyaltyProgramDto> findAllPrograms();
    LoyaltyProgramDto createProgram(LoyaltyProgramDto dto);
    LoyaltyProgramDto updateProgram(Long id, LoyaltyProgramDto dto);
    LoyaltyProgramDto activateProgram(Long id);
    void deleteProgram(Long id);

    ClientProfileDto getProfileByUserId(Long userId);
    List<ClientProfileDto> findAllClients();
    LoyaltyStatsDto getStats();
    List<LoyaltyRewardDto> getRecentRewards();

    void onOrderDelivered(Order order);
}
