package com.luxart.ecommerce.service;

import com.luxart.ecommerce.dto.AIAdvisorDto;

import java.util.List;

public interface AIAdvisorService {
    List<AIAdvisorDto> findAll();
    AIAdvisorDto findById(Long id);
    AIAdvisorDto create(AIAdvisorDto dto);
    AIAdvisorDto update(Long id, AIAdvisorDto dto);
    void delete(Long id);
}
