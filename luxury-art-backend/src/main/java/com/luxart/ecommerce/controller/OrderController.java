package com.luxart.ecommerce.controller;

import com.luxart.ecommerce.dto.*;
import com.luxart.ecommerce.model.enums.OrderCanal;
import com.luxart.ecommerce.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @GetMapping
    public ResponseEntity<List<OrderDto>> getAll(
            @RequestParam(required = false) OrderCanal canal) {
        if (canal != null) {
            return ResponseEntity.ok(orderService.findByCanal(canal));
        }
        return ResponseEntity.ok(orderService.findAll());
    }

    @GetMapping("/stats/channels")
    public OrderChannelStatsDto getChannelStats() {
        return orderService.getChannelStats();
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.findById(id));
    }

    @PostMapping
    public ResponseEntity<OrderDto> create(@Valid @RequestBody OrderDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.create(dto));
    }

    @PostMapping("/facebook")
    public ResponseEntity<OrderDto> createFacebookOrder(@Valid @RequestBody FacebookOrderCreateDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.createFacebookOrder(dto));
    }

    @PostMapping("/instagram")
    public ResponseEntity<OrderDto> createInstagramOrder(@Valid @RequestBody InstagramOrderCreateDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.createInstagramOrder(dto));
    }

    @PostMapping("/whatsapp")
    public ResponseEntity<OrderDto> createWhatsAppOrder(@Valid @RequestBody WhatsAppOrderCreateDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.createWhatsAppOrder(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<OrderDto> update(@PathVariable Long id, @Valid @RequestBody OrderDto dto) {
        return ResponseEntity.ok(orderService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        orderService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
