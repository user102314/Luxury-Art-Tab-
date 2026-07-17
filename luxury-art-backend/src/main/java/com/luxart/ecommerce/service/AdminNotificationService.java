package com.luxart.ecommerce.service;

import com.luxart.ecommerce.dto.AdminNotificationDto;
import com.luxart.ecommerce.dto.OrderDto;
import com.luxart.ecommerce.event.OrderCreatedEvent;
import com.luxart.ecommerce.model.enums.OrderCanal;
import com.luxart.ecommerce.websocket.OrderNotificationWebSocketHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Listener métier : dès qu'une commande est commitée en base, push WebSocket vers les admins.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AdminNotificationService {

    private final OrderNotificationWebSocketHandler webSocketHandler;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onOrderCreated(OrderCreatedEvent event) {
        OrderDto order = event.order();
        OrderCanal canal = order.getCanal() != null ? order.getCanal() : OrderCanal.SITE_WEB;
        String client = order.getClientNom() != null ? order.getClientNom() : order.getUserNom();
        BigDecimal total = order.getTotal() != null ? order.getTotal() : BigDecimal.ZERO;

        AdminNotificationDto dto = AdminNotificationDto.builder()
                .type("NEW_ORDER")
                .title("Nouvelle commande #" + order.getId())
                .message(client + " · " + canal.name() + " · " + total + " DH")
                .orderId(order.getId())
                .canal(canal.name())
                .clientNom(client)
                .total(total)
                .createdAt(LocalDateTime.now().toString())
                .build();

        webSocketHandler.broadcast(dto);
    }
}
