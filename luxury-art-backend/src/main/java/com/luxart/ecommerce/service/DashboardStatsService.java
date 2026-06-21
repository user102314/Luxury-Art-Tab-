package com.luxart.ecommerce.service;

import com.luxart.ecommerce.dto.DashboardStatsDto;

import java.util.List;

public interface DashboardStatsService {
    List<DashboardStatsDto> findAll();
    DashboardStatsDto findById(Long id);
    DashboardStatsDto create(DashboardStatsDto dto);
    DashboardStatsDto update(Long id, DashboardStatsDto dto);
    void delete(Long id);
    DashboardStatsDto genererRapport();
}
