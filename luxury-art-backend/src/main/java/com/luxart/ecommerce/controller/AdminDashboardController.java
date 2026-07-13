package com.luxart.ecommerce.controller;

import com.luxart.ecommerce.dto.AnalyticsPeriod;
import com.luxart.ecommerce.dto.DashboardSummaryDto;
import com.luxart.ecommerce.dto.ProductStatsDto;
import com.luxart.ecommerce.dto.TimeSeriesPointDto;
import com.luxart.ecommerce.model.enums.SalesGranularity;
import com.luxart.ecommerce.model.enums.TopProductCriteria;
import com.luxart.ecommerce.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Dashboard analytics admin.
 * Note: le projet n'a pas Spring Security / JWT — ces endpoints suivent le même
 * modèle que {@code /api/admin/site/settings} (protection côté front admin uniquement).
 */
@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryDto> summary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(dashboardService.getDashboardSummary(AnalyticsPeriod.of(from, to)));
    }

    @GetMapping("/sales-over-time")
    public ResponseEntity<List<TimeSeriesPointDto>> salesOverTime(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "DAY") SalesGranularity granularity) {
        return ResponseEntity.ok(dashboardService.getSalesOverTime(AnalyticsPeriod.of(from, to), granularity));
    }

    @GetMapping("/top-products")
    public ResponseEntity<List<ProductStatsDto>> topProducts(
            @RequestParam(defaultValue = "SALES") TopProductCriteria criteria,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(dashboardService.getTopProducts(criteria, limit, AnalyticsPeriod.of(from, to)));
    }

    @GetMapping("/product-stats")
    public ResponseEntity<List<ProductStatsDto>> productStats(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(dashboardService.getAllProductStats(AnalyticsPeriod.of(from, to)));
    }
}
