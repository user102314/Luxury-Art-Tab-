package com.luxart.ecommerce.service;

import com.luxart.ecommerce.colissimo.ColissimoParcelImportService;
import com.luxart.ecommerce.colissimo.dto.ColissimoParcel;
import com.luxart.ecommerce.dto.AdminNotificationDto;
import com.luxart.ecommerce.event.OrderCreatedEvent;
import com.luxart.ecommerce.exception.ResourceNotFoundException;
import com.luxart.ecommerce.model.entity.AdminNotification;
import com.luxart.ecommerce.model.entity.Order;
import com.luxart.ecommerce.model.enums.OrderCanal;
import com.luxart.ecommerce.repository.AdminNotificationRepository;
import com.luxart.ecommerce.websocket.OrderNotificationWebSocketHandler;
import com.luxart.ecommerce.dto.OrderDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminNotificationService {

    private final AdminNotificationRepository repository;
    private final OrderNotificationWebSocketHandler webSocketHandler;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onOrderCreated(OrderCreatedEvent event) {
        OrderDto order = event.order();
        OrderCanal canal = order.getCanal() != null ? order.getCanal() : OrderCanal.SITE_WEB;
        String client = order.getClientNom() != null ? order.getClientNom() : order.getUserNom();
        BigDecimal total = order.getTotal() != null ? order.getTotal() : BigDecimal.ZERO;

        notify(AdminNotificationDto.builder()
                .type("NEW_ORDER")
                .title("Commande #" + order.getId() + " — " + client)
                .message(buildOrderSummary(client, canal.name(), total, order.getNumeroColis()))
                .orderId(order.getId())
                .canal(canal.name())
                .clientNom(client)
                .clientTelephone(order.getClientTelephone())
                .total(total)
                .colissimoCodeBarre(order.getColissimoCodeBarre() != null
                        ? order.getColissimoCodeBarre() : order.getNumeroColis())
                .statut(order.getStatut() != null ? order.getStatut().name() : null)
                .adresseLivraison(order.getAdresseLivraison())
                .colissimoDesignation(order.getColissimoDesignation())
                .createdAt(LocalDateTime.now().toString())
                .build());
    }

    @Transactional
    public void notifyColissimoParcel(
            Order order,
            ColissimoParcel parcel,
            ColissimoParcelImportService.ImportOutcome outcome) {
        if (order == null) {
            return;
        }

        OrderCanal canal = order.getCanal() != null ? order.getCanal() : OrderCanal.FACEBOOK;
        String client = order.getClientNom() != null ? order.getClientNom() : "Client Colissimo";
        BigDecimal total = order.getTotal() != null ? order.getTotal() : BigDecimal.ZERO;
        boolean created = outcome == ColissimoParcelImportService.ImportOutcome.CREATED;

        notify(AdminNotificationDto.builder()
                .type(created ? "COLISSIMO_ORDER" : "COLISSIMO_ORDER_UPDATE")
                .title((created ? "Nouveau colis Colissimo" : "Colis Colissimo mis à jour")
                        + " — Commande #" + order.getId())
                .message(buildColissimoSummary(client, canal.name(), total, parcel))
                .orderId(order.getId())
                .canal(canal.name())
                .clientNom(client)
                .clientTelephone(order.getClientTelephone() != null ? order.getClientTelephone() : parcel.getTel1())
                .total(total)
                .colissimoCodeBarre(parcel.getCode())
                .colissimoEtat(parcel.getEtat())
                .statut(order.getStatut() != null ? order.getStatut().name() : null)
                .adresseLivraison(order.getAdresseLivraison())
                .colissimoDesignation(parcel.getDesignation())
                .reference(parcel.getReference())
                .createdAt(LocalDateTime.now().toString())
                .build());
    }

    @Transactional
    public AdminNotificationDto notify(AdminNotificationDto dto) {
        AdminNotification saved = repository.save(AdminNotification.builder()
                .type(dto.getType())
                .title(dto.getTitle())
                .message(dto.getMessage())
                .orderId(dto.getOrderId())
                .canal(dto.getCanal())
                .clientNom(dto.getClientNom())
                .clientTelephone(dto.getClientTelephone())
                .total(dto.getTotal())
                .colissimoCodeBarre(dto.getColissimoCodeBarre())
                .colissimoEtat(dto.getColissimoEtat())
                .statut(dto.getStatut())
                .adresseLivraison(dto.getAdresseLivraison())
                .colissimoDesignation(dto.getColissimoDesignation())
                .reference(dto.getReference())
                .createdAt(parseCreatedAt(dto.getCreatedAt()))
                .read(false)
                .build());

        AdminNotificationDto payload = toDto(saved);
        webSocketHandler.broadcast(payload);
        return payload;
    }

    @Transactional(readOnly = true)
    public List<AdminNotificationDto> findAll() {
        return repository.findTop100ByOrderByCreatedAtDesc().stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public long countUnread() {
        return repository.countByReadFalse();
    }

    @Transactional
    public void markAllRead() {
        repository.findTop100ByOrderByCreatedAtDesc().stream()
                .filter(n -> !Boolean.TRUE.equals(n.getRead()))
                .forEach(n -> n.setRead(true));
    }

    @Transactional
    public void markRead(Long id) {
        AdminNotification n = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification introuvable: " + id));
        n.setRead(true);
    }

    private static String buildOrderSummary(String client, String canal, BigDecimal total, String colis) {
        StringBuilder sb = new StringBuilder();
        sb.append(client).append(" · ").append(canal).append(" · ").append(total).append(" TND");
        if (colis != null && !colis.isBlank()) {
            sb.append(" · Colis ").append(colis);
        }
        return sb.toString();
    }

    private static String buildColissimoSummary(
            String client, String canal, BigDecimal total, ColissimoParcel parcel) {
        StringBuilder sb = new StringBuilder();
        sb.append(client).append(" · ").append(canal);
        if (parcel.getCode() != null) {
            sb.append(" · Colis ").append(parcel.getCode());
        }
        sb.append(" · ").append(total).append(" TND");
        if (parcel.getEtat() != null && !parcel.getEtat().isBlank()) {
            sb.append(" · ").append(parcel.getEtat());
        }
        return sb.toString();
    }

    private AdminNotificationDto toDto(AdminNotification n) {
        return AdminNotificationDto.builder()
                .id(n.getId())
                .type(n.getType())
                .title(n.getTitle())
                .message(n.getMessage())
                .orderId(n.getOrderId())
                .canal(n.getCanal())
                .clientNom(n.getClientNom())
                .clientTelephone(n.getClientTelephone())
                .total(n.getTotal())
                .colissimoCodeBarre(n.getColissimoCodeBarre())
                .colissimoEtat(n.getColissimoEtat())
                .statut(n.getStatut())
                .adresseLivraison(n.getAdresseLivraison())
                .colissimoDesignation(n.getColissimoDesignation())
                .reference(n.getReference())
                .createdAt(n.getCreatedAt().toString())
                .read(Boolean.TRUE.equals(n.getRead()))
                .build();
    }

    private static LocalDateTime parseCreatedAt(String raw) {
        if (raw == null || raw.isBlank()) {
            return LocalDateTime.now();
        }
        try {
            return LocalDateTime.parse(raw);
        } catch (Exception e) {
            return LocalDateTime.now();
        }
    }
}
