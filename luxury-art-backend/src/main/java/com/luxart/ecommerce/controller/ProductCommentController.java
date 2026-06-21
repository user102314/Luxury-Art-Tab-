package com.luxart.ecommerce.controller;

import com.luxart.ecommerce.dto.ProductCommentDto;
import com.luxart.ecommerce.service.ProductCommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/product-comments")
@RequiredArgsConstructor
public class ProductCommentController {

    private final ProductCommentService productCommentService;

    @GetMapping
    public ResponseEntity<List<ProductCommentDto>> getAll() {
        return ResponseEntity.ok(productCommentService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductCommentDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(productCommentService.findById(id));
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<ProductCommentDto>> getByProduct(@PathVariable Long productId) {
        return ResponseEntity.ok(productCommentService.findByProductId(productId));
    }

    @PostMapping
    public ResponseEntity<ProductCommentDto> create(@Valid @RequestBody ProductCommentDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productCommentService.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductCommentDto> update(@PathVariable Long id, @Valid @RequestBody ProductCommentDto dto) {
        return ResponseEntity.ok(productCommentService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        productCommentService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
