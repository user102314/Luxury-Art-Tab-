package com.luxart.ecommerce.controller;

import com.luxart.ecommerce.dto.DashboardStatsDto;
import com.luxart.ecommerce.service.DashboardStatsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard-stats")
@RequiredArgsConstructor
public class DashboardStatsController {

    private final DashboardStatsService dashboardStatsService;

    @GetMapping
    public ResponseEntity<List<DashboardStatsDto>> getAll() {
        return ResponseEntity.ok(dashboardStatsService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DashboardStatsDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(dashboardStatsService.findById(id));
    }

    @PostMapping
    public ResponseEntity<DashboardStatsDto> create(@Valid @RequestBody DashboardStatsDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(dashboardStatsService.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DashboardStatsDto> update(@PathVariable Long id, @Valid @RequestBody DashboardStatsDto dto) {
        return ResponseEntity.ok(dashboardStatsService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        dashboardStatsService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/generer-rapport")
    public ResponseEntity<DashboardStatsDto> genererRapport() {
        return ResponseEntity.status(HttpStatus.CREATED).body(dashboardStatsService.genererRapport());
    }
}
