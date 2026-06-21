package com.luxart.ecommerce.controller;

import com.luxart.ecommerce.dto.*;
import com.luxart.ecommerce.service.LoyaltyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/loyalty")
@RequiredArgsConstructor
public class LoyaltyController {

    private final LoyaltyService loyaltyService;

    @GetMapping("/program/active")
    public ResponseEntity<LoyaltyProgramDto> getActiveProgram() {
        LoyaltyProgramDto program = loyaltyService.getActiveProgram();
        return program != null ? ResponseEntity.ok(program) : ResponseEntity.noContent().build();
    }

    @GetMapping("/programs")
    public List<LoyaltyProgramDto> listPrograms() {
        return loyaltyService.findAllPrograms();
    }

    @PostMapping("/programs")
    public ResponseEntity<LoyaltyProgramDto> createProgram(@Valid @RequestBody LoyaltyProgramDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(loyaltyService.createProgram(dto));
    }

    @PutMapping("/programs/{id}")
    public LoyaltyProgramDto updateProgram(@PathVariable Long id, @Valid @RequestBody LoyaltyProgramDto dto) {
        return loyaltyService.updateProgram(id, dto);
    }

    @PatchMapping("/programs/{id}/activate")
    public LoyaltyProgramDto activateProgram(@PathVariable Long id) {
        return loyaltyService.activateProgram(id);
    }

    @DeleteMapping("/programs/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProgram(@PathVariable Long id) {
        loyaltyService.deleteProgram(id);
    }

    @GetMapping("/stats")
    public LoyaltyStatsDto getStats() {
        return loyaltyService.getStats();
    }

    @GetMapping("/clients")
    public List<ClientProfileDto> listClients() {
        return loyaltyService.findAllClients();
    }

    @GetMapping("/clients/{userId}")
    public ClientProfileDto getClient(@PathVariable Long userId) {
        return loyaltyService.getProfileByUserId(userId);
    }

    @GetMapping("/rewards/recent")
    public List<LoyaltyRewardDto> recentRewards() {
        return loyaltyService.getRecentRewards();
    }
}
