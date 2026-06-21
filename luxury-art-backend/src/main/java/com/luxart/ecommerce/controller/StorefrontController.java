package com.luxart.ecommerce.controller;

import com.luxart.ecommerce.dto.StorefrontCheckoutRequest;
import com.luxart.ecommerce.dto.StorefrontCheckoutResponse;
import com.luxart.ecommerce.dto.VisitorRegisterRequest;
import com.luxart.ecommerce.dto.VisitorResponse;
import com.luxart.ecommerce.service.StorefrontService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/storefront")
@RequiredArgsConstructor
public class StorefrontController {

    private final StorefrontService storefrontService;

    @PostMapping("/visitor")
    public ResponseEntity<VisitorResponse> registerVisitor(@Valid @RequestBody VisitorRegisterRequest request) {
        return ResponseEntity.ok(storefrontService.registerVisitor(request));
    }

    @PostMapping("/checkout")
    public ResponseEntity<StorefrontCheckoutResponse> checkout(@Valid @RequestBody StorefrontCheckoutRequest request) {
        return ResponseEntity.ok(storefrontService.checkout(request));
    }
}
