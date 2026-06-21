package com.luxart.ecommerce.controller;

import com.luxart.ecommerce.dto.ProductLikeDto;
import com.luxart.ecommerce.dto.ProductLikeSummaryDto;
import com.luxart.ecommerce.service.ProductLikeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductLikeController {

    private final ProductLikeService productLikeService;

    @GetMapping("/{productId}/likes")
    public ResponseEntity<ProductLikeSummaryDto> getLikeSummary(
            @PathVariable Long productId,
            @RequestParam(required = false) Long userId) {
        return ResponseEntity.ok(productLikeService.getSummary(productId, userId));
    }

    @GetMapping("/{productId}/likes/list")
    public ResponseEntity<List<ProductLikeDto>> listLikes(@PathVariable Long productId) {
        return ResponseEntity.ok(productLikeService.findByProductId(productId));
    }

    @PostMapping("/{productId}/likes")
    public ResponseEntity<ProductLikeDto> like(
            @PathVariable Long productId,
            @RequestBody Map<String, Long> body) {
        Long userId = body.get("userId");
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(productLikeService.like(productId, userId));
    }

    @DeleteMapping("/{productId}/likes")
    public ResponseEntity<Void> unlike(
            @PathVariable Long productId,
            @RequestParam Long userId) {
        productLikeService.unlike(productId, userId);
        return ResponseEntity.noContent().build();
    }
}
