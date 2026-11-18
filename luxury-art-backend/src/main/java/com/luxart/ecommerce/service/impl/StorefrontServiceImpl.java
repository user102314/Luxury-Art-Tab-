package com.luxart.ecommerce.service.impl;

import com.luxart.ecommerce.dto.StorefrontCheckoutRequest;
import com.luxart.ecommerce.dto.StorefrontCheckoutResponse;
import com.luxart.ecommerce.dto.VisitorRegisterRequest;
import com.luxart.ecommerce.dto.VisitorResponse;
import com.luxart.ecommerce.event.OrderCreatedEvent;
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
import com.luxart.ecommerce.dto.OrderDto;
import com.luxart.ecommerce.service.StockService;
import com.luxart.ecommerce.service.StorefrontService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
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
    private final ApplicationEventPublisher eventPublisher;
    private final com.luxart.ecommerce.meta.MetaConversionsService metaService;
    private final com.luxart.ecommerce.meta.MetaProperties metaProps;

    @Override
    public VisitorResponse registerVisitor(VisitorRegisterRequest request) {
        return toResponse(resolveOrCreateUser(request.getVisitorKey(), request.getNom()));
    }

    public static final BigDecimal FRAIS_LIVRAISON = BigDecimal.valueOf(8);

    @Override
    @Transactional
    public StorefrontCheckoutResponse checkout(StorefrontCheckoutRequest request,
            com.luxart.ecommerce.meta.MetaConversionsService.ClientContext clientContext) {
        User user = resolveCheckoutUser(request);

        BigDecimal itemsTotal = request.getItems().stream()
                .map(i -> i.getPrixUnitaire().multiply(BigDecimal.valueOf(i.getQuantite())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal shippingFee = (request.getItems() == null || request.getItems().isEmpty())
                ? BigDecimal.ZERO
                : FRAIS_LIVRAISON;
        BigDecimal total = itemsTotal.add(shippingFee);

        Order order = Order.builder()
                .user(user)
                .statut(OrderStatut.EN_ATTENTE)
                .total(total)
                .adresseLivraison(request.getAdresseLivraison())
                .canal(OrderCanal.SITE_WEB)
                .clientNom(request.getNom())
                .clientTelephone(blankToNull(request.getTelephone()))
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
                    .taille(blankToNull(line.getTaille()))
                    .encadrement(blankToNull(line.getEncadrement()))
                    .couleur(blankToNull(line.getCouleur()))
                    .build();
            orderItemRepository.save(item);
        }

        order.setStockDeduit(true);
        orderRepository.save(order);

        eventPublisher.publishEvent(new OrderCreatedEvent(OrderDto.builder()
                .id(order.getId())
                .userId(user.getId())
                .userNom(request.getNom())
                .clientNom(request.getNom())
                .statut(order.getStatut())
                .total(total)
                .adresseLivraison(order.getAdresseLivraison())
                .canal(OrderCanal.SITE_WEB)
                .clientTelephone(order.getClientTelephone())
                .dateCommande(order.getDateCommande())
                .build()));

        sendMetaPurchase(request, order, total, clientContext);

        return StorefrontCheckoutResponse.builder()
                .orderId(order.getId())
                .userId(user.getId())
                .total(total)
                .build();
    }

    /** Purchase CAPI (même event_id que le Pixel navigateur). Asynchrone, après commit. */
    private void sendMetaPurchase(StorefrontCheckoutRequest request, Order order, BigDecimal total,
                                  com.luxart.ecommerce.meta.MetaConversionsService.ClientContext ctx) {
        try {
            com.luxart.ecommerce.meta.MetaEventRequest ev = new com.luxart.ecommerce.meta.MetaEventRequest();
            ev.setEventName("Purchase");
            ev.setEventId(blankToNull(request.getMetaEventId()) != null
                    ? request.getMetaEventId().trim() : "order-" + order.getId());
            ev.setEventSourceUrl(request.getEventSourceUrl());
            ev.setFbp(request.getFbp());
            ev.setFbc(request.getFbc());
            ev.setVisitorKey(request.getVisitorKey());
            ev.setEmail(request.getEmail());
            ev.setPhone(request.getTelephone());
            String[] names = com.luxart.ecommerce.meta.MetaConversionsService.splitName(request.getNom());
            ev.setFirstName(names[0]);
            ev.setLastName(names[1]);
            ev.setValue(total);
            ev.setCurrency(metaProps.getCurrency());
            ev.setContentIds(request.getItems().stream()
                    .map(i -> String.valueOf(i.getProductId())).distinct().toList());
            ev.setNumItems(request.getItems().stream().mapToInt(StorefrontCheckoutRequest.CheckoutLineItem::getQuantite).sum());
            metaService.send(ev, ctx);
        } catch (Exception ignored) {
            // Meta ne doit jamais faire échouer une commande
        }
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
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
