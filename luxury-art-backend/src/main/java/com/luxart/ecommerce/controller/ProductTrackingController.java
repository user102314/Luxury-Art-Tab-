package com.luxart.ecommerce.controller;

import com.luxart.ecommerce.dto.ProductTrackRequest;
import com.luxart.ecommerce.model.enums.ProductEventType;
import com.luxart.ecommerce.service.ProductAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/products/{id}/track")
@RequiredArgsConstructor
public class ProductTrackingController {

    private final ProductAnalyticsService productAnalyticsService;

    @PostMapping("/view")
    public ResponseEntity<Void> trackView(
            @PathVariable Long id,
            @RequestBody(required = false) ProductTrackRequest request) {
        track(id, ProductEventType.VIEW, request);
        return ResponseEntity.status(HttpStatus.ACCEPTED).build();
    }

    @PostMapping("/click")
    public ResponseEntity<Void> trackClick(
            @PathVariable Long id,
            @RequestBody(required = false) ProductTrackRequest request) {
        ProductEventType type = ProductEventType.CLICK;
        if (request != null && request.getEventType() != null
                && (request.getEventType() == ProductEventType.CLICK
                || request.getEventType() == ProductEventType.ADD_TO_CART)) {
            type = request.getEventType();
        }
        track(id, type, request);
        return ResponseEntity.status(HttpStatus.ACCEPTED).build();
    }

    private void track(Long productId, ProductEventType type, ProductTrackRequest request) {
        String sessionId = request != null ? request.getSessionId() : null;
        Long userId = request != null ? request.getUserId() : null;
        if (sessionId == null || sessionId.isBlank()) {
            sessionId = "anonymous";
        }
        productAnalyticsService.trackEvent(productId, type, sessionId, userId);
    }
}
