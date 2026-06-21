package com.luxart.ecommerce.controller;

import com.luxart.ecommerce.dto.ProductCommentDto;
import com.luxart.ecommerce.dto.ProductDto;
import com.luxart.ecommerce.dto.ProductAnalyticsDto;
import com.luxart.ecommerce.dto.ProductBestSellerDto;
import com.luxart.ecommerce.service.ProductAnalyticsService;
import com.luxart.ecommerce.service.ProductCommentService;
import com.luxart.ecommerce.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final ProductCommentService productCommentService;
    private final ProductAnalyticsService productAnalyticsService;

    @GetMapping("/analytics/best-sellers")
    public ResponseEntity<List<ProductBestSellerDto>> getBestSellers() {
        return ResponseEntity.ok(productAnalyticsService.getBestSellers());
    }

    @GetMapping("/{id}/analytics")
    public ResponseEntity<ProductAnalyticsDto> getAnalytics(@PathVariable Long id) {
        return ResponseEntity.ok(productAnalyticsService.getAnalytics(id));
    }

    @GetMapping
    public ResponseEntity<List<ProductDto>> getAll() {
        return ResponseEntity.ok(productService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.findById(id));
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<List<ProductCommentDto>> getComments(@PathVariable Long id) {
        return ResponseEntity.ok(productCommentService.findByProductId(id));
    }

    @PostMapping
    public ResponseEntity<ProductDto> create(@Valid @RequestBody ProductDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductDto> update(@PathVariable Long id, @Valid @RequestBody ProductDto dto) {
        return ResponseEntity.ok(productService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        productService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
