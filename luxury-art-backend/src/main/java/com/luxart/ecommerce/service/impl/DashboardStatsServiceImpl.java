package com.luxart.ecommerce.service.impl;

import com.luxart.ecommerce.dto.DashboardStatsDto;
import com.luxart.ecommerce.exception.ResourceNotFoundException;
import com.luxart.ecommerce.model.entity.DashboardStats;
import com.luxart.ecommerce.model.entity.DateRange;
import com.luxart.ecommerce.model.entity.Order;
import com.luxart.ecommerce.model.enums.OrderStatut;
import com.luxart.ecommerce.repository.DashboardStatsRepository;
import com.luxart.ecommerce.repository.OrderRepository;
import com.luxart.ecommerce.service.DashboardStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardStatsServiceImpl implements DashboardStatsService {

    private final DashboardStatsRepository dashboardStatsRepository;
    private final OrderRepository orderRepository;

    @Override
    public List<DashboardStatsDto> findAll() {
        return dashboardStatsRepository.findAll().stream().map(this::toDto).toList();
    }

    @Override
    public DashboardStatsDto findById(Long id) {
        return toDto(getEntity(id));
    }

    @Override
    public DashboardStatsDto create(DashboardStatsDto dto) {
        DashboardStats stats = toEntity(dto);
        return toDto(dashboardStatsRepository.save(stats));
    }

    @Override
    public DashboardStatsDto update(Long id, DashboardStatsDto dto) {
        DashboardStats stats = getEntity(id);
        stats.setPeriode(buildDateRange(dto));
        stats.setTotalCommandes(dto.getTotalCommandes());
        stats.setChiffreAffaires(dto.getChiffreAffaires());
        stats.setProfitBrut(dto.getProfitBrut());
        stats.setProfitNet(dto.getProfitNet());
        stats.setTopProduits(dto.getTopProduits());
        return toDto(dashboardStatsRepository.save(stats));
    }

    @Override
    public void delete(Long id) {
        dashboardStatsRepository.delete(getEntity(id));
    }

    @Override
    public DashboardStatsDto genererRapport() {
        List<Order> revenueOrders = orderRepository.findAll().stream()
                .filter(o -> o.getStatut() == OrderStatut.LIVREE)
                .toList();

        BigDecimal chiffreAffaires = revenueOrders.stream()
                .map(o -> o.getTotal() != null ? o.getTotal() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        DashboardStats stats = DashboardStats.builder()
                .periode(DateRange.builder()
                        .dateDebut(LocalDate.now().minusMonths(1))
                        .dateFin(LocalDate.now())
                        .build())
                .totalCommandes((long) revenueOrders.size())
                .chiffreAffaires(chiffreAffaires)
                .profitBrut(chiffreAffaires.multiply(BigDecimal.valueOf(0.3)))
                .profitNet(chiffreAffaires.multiply(BigDecimal.valueOf(0.15)))
                .topProduits("[]")
                .build();

        return toDto(dashboardStatsRepository.save(stats));
    }

    private DashboardStats getEntity(Long id) {
        return dashboardStatsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Statistiques introuvables: " + id));
    }

    private DateRange buildDateRange(DashboardStatsDto dto) {
        return DateRange.builder()
                .dateDebut(dto.getDateDebut())
                .dateFin(dto.getDateFin())
                .build();
    }

    private DashboardStats toEntity(DashboardStatsDto dto) {
        return DashboardStats.builder()
                .periode(buildDateRange(dto))
                .totalCommandes(dto.getTotalCommandes())
                .chiffreAffaires(dto.getChiffreAffaires())
                .profitBrut(dto.getProfitBrut())
                .profitNet(dto.getProfitNet())
                .topProduits(dto.getTopProduits())
                .build();
    }

    private DashboardStatsDto toDto(DashboardStats stats) {
        return DashboardStatsDto.builder()
                .id(stats.getId())
                .dateDebut(stats.getPeriode() != null ? stats.getPeriode().getDateDebut() : null)
                .dateFin(stats.getPeriode() != null ? stats.getPeriode().getDateFin() : null)
                .totalCommandes(stats.getTotalCommandes())
                .chiffreAffaires(stats.getChiffreAffaires())
                .profitBrut(stats.getProfitBrut())
                .profitNet(stats.getProfitNet())
                .topProduits(stats.getTopProduits())
                .build();
    }
}
