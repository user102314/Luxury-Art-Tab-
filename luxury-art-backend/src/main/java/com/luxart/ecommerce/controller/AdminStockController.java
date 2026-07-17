package com.luxart.ecommerce.controller;

import com.luxart.ecommerce.dto.ProductDto;
import com.luxart.ecommerce.dto.RestockRequestDto;
import com.luxart.ecommerce.dto.StockAlertDto;
import com.luxart.ecommerce.model.entity.Product;
import com.luxart.ecommerce.model.enums.ProductStatut;
import com.luxart.ecommerce.repository.ProductRepository;
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

    private final ProductRepository productRepository;
    private final StockService stockService;
    private final ProductService productService;

    @GetMapping("/alerts")
    public ResponseEntity<List<StockAlertDto>> alerts() {
        List<StockAlertDto> alerts = productRepository.findAll().stream()
                .filter(p -> p.getStatut() != ProductStatut.ARCHIVE)
                .filter(p -> p.getStock() == null || p.getStock() <= 0 || p.getStatut() == ProductStatut.RUPTURE_STOCK)
                .map(this::toAlert)
                .toList();
        return ResponseEntity.ok(alerts);
    }

    @PostMapping("/{productId}/restock")
    public ResponseEntity<ProductDto> restock(
            @PathVariable Long productId,
            @Valid @RequestBody RestockRequestDto dto) {
        stockService.increaseStock(productId, dto.getQuantite());
        return ResponseEntity.ok(productService.findById(productId));
    }

    private StockAlertDto toAlert(Product p) {
        return StockAlertDto.builder()
                .productId(p.getId())
                .nom(p.getNom())
                .stock(p.getStock())
                .statut(p.getStatut() != null ? p.getStatut().name() : null)
                .imageUrl(p.getImageUrl())
                .build();
    }
}
