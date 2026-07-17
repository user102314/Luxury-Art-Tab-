package com.luxart.ecommerce.controller;

import com.luxart.ecommerce.dto.ClientCrmDto;
import com.luxart.ecommerce.service.ClientCrmService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/clients")
@RequiredArgsConstructor
public class AdminClientController {

    private final ClientCrmService clientCrmService;

    @GetMapping
    public ResponseEntity<List<ClientCrmDto>> list() {
        return ResponseEntity.ok(clientCrmService.findAllClients());
    }

    @GetMapping("/{userId}")
    public ResponseEntity<ClientCrmDto> get(@PathVariable Long userId) {
        return ResponseEntity.ok(clientCrmService.findByUserId(userId));
    }
}
