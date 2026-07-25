package com.luxart.ecommerce.controller;

import com.luxart.ecommerce.colissimo.ColissimoApiException;
import com.luxart.ecommerce.colissimo.ColissimoShipmentService;
import com.luxart.ecommerce.colissimo.ColissimoSyncService;
import com.luxart.ecommerce.colissimo.dto.ColissimoSyncResultDto;
import com.luxart.ecommerce.colissimo.dto.ColissimoSyncStatusDto;
import com.luxart.ecommerce.exception.ResourceNotFoundException;
import com.luxart.ecommerce.model.entity.Order;
import com.luxart.ecommerce.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/colissimo")
@RequiredArgsConstructor
public class ColissimoController {

    private final ColissimoSyncService syncService;
    private final ColissimoShipmentService shipmentService;
    private final OrderRepository orderRepository;

    @GetMapping("/status")
    public ColissimoSyncStatusDto status() {
        return syncService.getStatus();
    }

    @PostMapping("/sync")
    public ResponseEntity<ColissimoSyncResultDto> sync() {
        return ResponseEntity.ok(syncService.syncNow());
    }

    @PostMapping("/orders/{orderId}/push")
    @Transactional
    public ResponseEntity<?> pushOrder(@PathVariable Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Commande introuvable: " + orderId));

        if (!shipmentService.isEligibleForColissimo(order)) {
            throw new ColissimoApiException("La commande doit être confirmée, expédiée ou livrée");
        }

        boolean pushed = shipmentService.pushOrderIfNeeded(order);
        if (!pushed) {
            throw new ColissimoApiException(
                    "Colissimo non disponible ou colis déjà existant pour cette commande");
        }

        orderRepository.save(order);
        return ResponseEntity.ok(java.util.Map.of(
                "orderId", order.getId(),
                "colissimoCodeBarre", order.getColissimoCodeBarre(),
                "numeroColis", order.getNumeroColis()
        ));
    }

    @GetMapping("/orders/{orderId}/invoice")
    @Transactional
    public ResponseEntity<byte[]> downloadInvoice(@PathVariable Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Commande introuvable: " + orderId));

        if (shipmentService.resolveCodeBarre(order) == null
                && shipmentService.isEligibleForColissimo(order)) {
            shipmentService.pushOrderIfNeeded(order);
            orderRepository.save(order);
        }

        byte[] pdf = shipmentService.getInvoicePdf(order);
        String code = shipmentService.resolveCodeBarre(order);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"colissimo-" + (code != null ? code : orderId) + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}
