package com.luxart.ecommerce.meta;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/meta")
@RequiredArgsConstructor
public class MetaController {

    private final MetaConversionsService meta;

    /** Relais navigateur vers CAPI (PageView, ViewContent, AddToCart, InitiateCheckout). */
    @PostMapping("/events")
    public ResponseEntity<Void> event(@Valid @RequestBody MetaEventRequest request, HttpServletRequest http) {
        // Purchase est émis uniquement côté serveur, à la création de la commande.
        if (!MetaConversionsService.isAllowed(request.getEventName())
                || "Purchase".equals(request.getEventName())) {
            return ResponseEntity.badRequest().build();
        }
        meta.send(request, MetaConversionsService.ClientContext.from(http));
        return ResponseEntity.status(HttpStatus.ACCEPTED).build();
    }
}
