package com.luxart.ecommerce.controller;

import com.luxart.ecommerce.dto.ProductDto;
import com.luxart.ecommerce.dto.RestockRequestDto;
import com.luxart.ecommerce.dto.StockAlertDto;
import com.luxart.ecommerce.service.ProductService;
import com.luxart.ecommerce.service.StockService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/stock")
@RequiredArgsConstructor
public class AdminStockController {

    private final StockService stockService;
    private final ProductService productService;

    @GetMapping("/alerts")
    public ResponseEntity<List<StockAlertDto>> alerts() {
        return ResponseEntity.ok(List.of());
    }

    @PostMapping("/{productId}/restock")
    public ResponseEntity<ProductDto> restock(
            @PathVariable Long productId,
            @Valid @RequestBody RestockRequestDto dto) {
        stockService.increaseStock(productId, dto.getQuantite());
        return ResponseEntity.ok(productService.findById(productId));
    }
}
