package com.luxart.ecommerce.service.impl;

import com.luxart.ecommerce.dto.StorefrontCheckoutRequest;
import com.luxart.ecommerce.dto.StorefrontCheckoutResponse;
import com.luxart.ecommerce.dto.VisitorRegisterRequest;
import com.luxart.ecommerce.dto.VisitorResponse;
import com.luxart.ecommerce.exception.ResourceNotFoundException;
import com.luxart.ecommerce.model.entity.Order;
import com.luxart.ecommerce.model.entity.OrderItem;
import com.luxart.ecommerce.model.entity.Product;
import com.luxart.ecommerce.model.entity.User;
import com.luxart.ecommerce.model.enums.OrderCanal;
import com.luxart.ecommerce.model.enums.OrderStatut;
import com.luxart.ecommerce.model.enums.Role;
import com.luxart.ecommerce.repository.OrderItemRepository;
import com.luxart.ecommerce.repository.OrderRepository;
import com.luxart.ecommerce.repository.ProductRepository;
import com.luxart.ecommerce.repository.UserRepository;
import com.luxart.ecommerce.service.StockService;
import com.luxart.ecommerce.service.StorefrontService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StorefrontServiceImpl implements StorefrontService {

    private static final String GUEST_DOMAIN = "@guest.luxart.local";

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final StockService stockService;

    @Override
    public VisitorResponse registerVisitor(VisitorRegisterRequest request) {
        return toResponse(resolveOrCreateUser(request.getVisitorKey(), request.getNom()));
    }

    @Override
    @Transactional
    public StorefrontCheckoutResponse checkout(StorefrontCheckoutRequest request) {
        User user = resolveCheckoutUser(request);

        BigDecimal total = request.getItems().stream()
                .map(i -> i.getPrixUnitaire().multiply(BigDecimal.valueOf(i.getQuantite())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Order order = Order.builder()
                .user(user)
                .statut(OrderStatut.EN_ATTENTE)
                .total(total)
                .adresseLivraison(request.getAdresseLivraison())
                .canal(OrderCanal.SITE_WEB)
                .clientNom(request.getNom())
                .stockDeduit(false)
                .build();
        order = orderRepository.save(order);

        for (StorefrontCheckoutRequest.CheckoutLineItem line : request.getItems()) {
            Product product = productRepository.findById(line.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable: " + line.getProductId()));

            stockService.decreaseStock(line.getProductId(), line.getQuantite());

            OrderItem item = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .quantite(line.getQuantite())
                    .prixUnitaire(line.getPrixUnitaire())
                    .build();
            orderItemRepository.save(item);
        }

        order.setStockDeduit(true);
        orderRepository.save(order);

        return StorefrontCheckoutResponse.builder()
                .orderId(order.getId())
                .userId(user.getId())
                .total(total)
                .build();
    }

    private User resolveCheckoutUser(StorefrontCheckoutRequest request) {
        if (request.getClientUserId() != null) {
            return userRepository.findById(request.getClientUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("Client introuvable"));
        }
        return resolveOrCreateUser(request.getVisitorKey(), request.getNom());
    }

    private User resolveOrCreateUser(String visitorKey, String nom) {
        String email = sanitizeKey(visitorKey) + GUEST_DOMAIN;
        return userRepository.findByEmail(email)
                .orElseGet(() -> userRepository.save(User.builder()
                        .nom(nom != null && !nom.isBlank() ? nom.trim() : "Visiteur")
                        .email(email)
                        .motDePasse(UUID.randomUUID().toString())
                        .role(Role.CLIENT)
                        .build()));
    }

    private String sanitizeKey(String key) {
        return key.replaceAll("[^a-zA-Z0-9-]", "").toLowerCase();
    }

    private VisitorResponse toResponse(User user) {
        return VisitorResponse.builder()
                .id(user.getId())
                .nom(user.getNom())
                .email(user.getEmail())
                .build();
    }
}
