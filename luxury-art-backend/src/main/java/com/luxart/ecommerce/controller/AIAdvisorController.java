package com.luxart.ecommerce.controller;

import com.luxart.ecommerce.dto.AIAdvisorDto;
import com.luxart.ecommerce.service.AIAdvisorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai-advisors")
@RequiredArgsConstructor
public class AIAdvisorController {

    private final AIAdvisorService aiAdvisorService;

    @GetMapping
    public ResponseEntity<List<AIAdvisorDto>> getAll() {
        return ResponseEntity.ok(aiAdvisorService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AIAdvisorDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(aiAdvisorService.findById(id));
    }

    @PostMapping
    public ResponseEntity<AIAdvisorDto> create(@Valid @RequestBody AIAdvisorDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(aiAdvisorService.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AIAdvisorDto> update(@PathVariable Long id, @Valid @RequestBody AIAdvisorDto dto) {
        return ResponseEntity.ok(aiAdvisorService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        aiAdvisorService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
