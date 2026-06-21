package com.luxart.ecommerce.service.impl;

import com.luxart.ecommerce.dto.*;
import com.luxart.ecommerce.exception.ResourceNotFoundException;
import com.luxart.ecommerce.model.entity.*;
import com.luxart.ecommerce.model.enums.OrderCanal;
import com.luxart.ecommerce.model.enums.OrderStatut;
import com.luxart.ecommerce.model.enums.Role;
import com.luxart.ecommerce.repository.ClientProfileRepository;
import com.luxart.ecommerce.repository.OrderItemRepository;
import com.luxart.ecommerce.repository.OrderRepository;
import com.luxart.ecommerce.repository.UserRepository;
import com.luxart.ecommerce.service.LoyaltyService;
import com.luxart.ecommerce.service.OrderService;
import com.luxart.ecommerce.service.StockService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private static final String FACEBOOK_DOMAIN = "@facebook.luxart.local";

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final LoyaltyService loyaltyService;
    private final StockService stockService;

    @Override
    @Transactional(readOnly = true)
    public List<OrderDto> findAll() {
        return orderRepository.findAll().stream().map(this::toDto).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderDto> findByCanal(OrderCanal canal) {
        return orderRepository.findByCanalOrderByDateCommandeDesc(canal).stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public OrderDto findById(Long id) {
        return toDto(getEntity(id));
    }

    @Override
    @Transactional
    public OrderDto create(OrderDto dto) {
        Order order = Order.builder()
                .user(getUser(dto.getUserId()))
                .statut(dto.getStatut())
                .total(dto.getTotal())
                .adresseLivraison(dto.getAdresseLivraison())
                .canal(dto.getCanal() != null ? dto.getCanal() : OrderCanal.SITE_WEB)
                .clientNom(dto.getClientNom())
                .clientTelephone(dto.getClientTelephone())
                .referenceFacebook(dto.getReferenceFacebook())
                .build();
        return toDto(orderRepository.save(order));
    }

    @Override
    @Transactional
    public OrderDto createFacebookOrder(FacebookOrderCreateDto dto) {
        User user = resolveFacebookClient(dto);

        BigDecimal total = BigDecimal.ZERO;
        for (FacebookOrderCreateDto.LineItem line : dto.getItems()) {
            Product product = stockService.getProductOrThrow(line.getProductId());
            BigDecimal unit = line.getPrixUnitaire() != null ? line.getPrixUnitaire() : product.getPrix();
            total = total.add(unit.multiply(BigDecimal.valueOf(line.getQuantite())));
        }

        Order order = Order.builder()
                .user(user)
                .statut(dto.getStatut() != null ? dto.getStatut() : OrderStatut.EN_ATTENTE)
                .total(total)
                .adresseLivraison(dto.getAdresseLivraison())
                .canal(OrderCanal.FACEBOOK)
                .clientNom(dto.getClientNom().trim())
                .clientTelephone(dto.getClientTelephone())
                .referenceFacebook(dto.getReferenceFacebook())
                .stockDeduit(false)
                .build();
        order = orderRepository.save(order);

        for (FacebookOrderCreateDto.LineItem line : dto.getItems()) {
            Product product = stockService.getProductOrThrow(line.getProductId());
            BigDecimal unit = line.getPrixUnitaire() != null ? line.getPrixUnitaire() : product.getPrix();

            stockService.decreaseStock(line.getProductId(), line.getQuantite());

            OrderItem item = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .quantite(line.getQuantite())
                    .prixUnitaire(unit)
                    .build();
            orderItemRepository.save(item);
        }

        order.setStockDeduit(true);
        order = orderRepository.save(order);

        if (order.getStatut() == OrderStatut.LIVREE) {
            loyaltyService.onOrderDelivered(order);
        }

        return toDto(order);
    }

    @Override
    @Transactional
    public OrderDto update(Long id, OrderDto dto) {
        Order order = getEntity(id);
        OrderStatut previous = order.getStatut();

        order.setUser(getUser(dto.getUserId()));
        order.setStatut(dto.getStatut());
        order.setTotal(dto.getTotal());
        order.setAdresseLivraison(dto.getAdresseLivraison());
        if (dto.getClientNom() != null) order.setClientNom(dto.getClientNom());
        if (dto.getClientTelephone() != null) order.setClientTelephone(dto.getClientTelephone());
        if (dto.getReferenceFacebook() != null) order.setReferenceFacebook(dto.getReferenceFacebook());

        Order saved = orderRepository.save(order);

        if (previous != OrderStatut.ANNULEE && saved.getStatut() == OrderStatut.ANNULEE) {
            restoreStockIfNeeded(saved);
        }
        if (previous != OrderStatut.LIVREE && saved.getStatut() == OrderStatut.LIVREE) {
            loyaltyService.onOrderDelivered(saved);
        }

        return toDto(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Order order = getEntity(id);
        restoreStockIfNeeded(order);
        orderRepository.delete(order);
    }

    @Override
    public OrderChannelStatsDto getChannelStats() {
        List<Order> all = orderRepository.findAll();
        BigDecimal caFacebook = BigDecimal.ZERO;
        BigDecimal caSite = BigDecimal.ZERO;
        long fbTotal = 0, webTotal = 0, fbLiv = 0, webLiv = 0;

        for (Order o : all) {
            boolean fb = o.getCanal() == OrderCanal.FACEBOOK;
            if (fb) fbTotal++;
            else webTotal++;

            if (o.getStatut() == OrderStatut.LIVREE) {
                BigDecimal amount = o.getTotal() != null ? o.getTotal() : BigDecimal.ZERO;
                if (fb) {
                    fbLiv++;
                    caFacebook = caFacebook.add(amount);
                } else {
                    webLiv++;
                    caSite = caSite.add(amount);
                }
            }
        }

        return OrderChannelStatsDto.builder()
                .totalFacebook(fbTotal)
                .totalSiteWeb(webTotal)
                .facebookLivrees(fbLiv)
                .siteWebLivrees(webLiv)
                .caFacebook(caFacebook)
                .caSiteWeb(caSite)
                .caTotal(caFacebook.add(caSite))
                .build();
    }

    private void restoreStockIfNeeded(Order order) {
        if (!Boolean.TRUE.equals(order.getStockDeduit())) return;
        for (OrderItem item : order.getItems()) {
            stockService.increaseStock(item.getProduct().getId(), item.getQuantite());
        }
        order.setStockDeduit(false);
        orderRepository.save(order);
    }

    private User resolveFacebookClient(FacebookOrderCreateDto dto) {
        if (dto.getClientEmail() != null && !dto.getClientEmail().isBlank()) {
            var byEmail = userRepository.findByEmail(dto.getClientEmail().trim().toLowerCase());
            if (byEmail.isPresent()) {
                updateClientPhone(byEmail.get(), dto.getClientTelephone());
                return byEmail.get();
            }
        }

        if (dto.getClientTelephone() != null && !dto.getClientTelephone().isBlank()) {
            var profile = clientProfileRepository.findFirstByTelephone(dto.getClientTelephone().trim());
            if (profile.isPresent()) {
                return profile.get().getUser();
            }
            var fbUser = userRepository.findByEmail(buildFacebookEmail(dto.getClientTelephone(), dto.getClientNom()));
            if (fbUser.isPresent()) {
                return fbUser.get();
            }
        }

        String email = buildFacebookEmail(
                dto.getClientTelephone() != null ? dto.getClientTelephone() : UUID.randomUUID().toString(),
                dto.getClientNom());

        User user = userRepository.save(User.builder()
                .nom(dto.getClientNom().trim())
                .email(email)
                .motDePasse(UUID.randomUUID().toString())
                .role(Role.CLIENT)
                .build());

        if (dto.getClientTelephone() != null && !dto.getClientTelephone().isBlank()) {
            clientProfileRepository.save(ClientProfile.builder()
                    .user(user)
                    .telephone(dto.getClientTelephone().trim())
                    .build());
        }

        return user;
    }

    private void updateClientPhone(User user, String telephone) {
        if (telephone == null || telephone.isBlank()) return;
        clientProfileRepository.findByUserId(user.getId()).ifPresentOrElse(
                p -> {
                    p.setTelephone(telephone.trim());
                    clientProfileRepository.save(p);
                },
                () -> clientProfileRepository.save(ClientProfile.builder()
                        .user(user)
                        .telephone(telephone.trim())
                        .build()));
    }

    private String buildFacebookEmail(String key, String nom) {
        String slug = (key + nom).replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
        if (slug.length() > 40) slug = slug.substring(0, 40);
        if (slug.isEmpty()) slug = UUID.randomUUID().toString().substring(0, 8);
        return slug + FACEBOOK_DOMAIN;
    }

    private Order getEntity(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Commande introuvable: " + id));
    }

    private User getUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable: " + id));
    }

    private OrderDto toDto(Order order) {
        String displayNom = order.getClientNom() != null ? order.getClientNom() : order.getUser().getNom();
        return OrderDto.builder()
                .id(order.getId())
                .userId(order.getUser().getId())
                .userNom(displayNom)
                .dateCommande(order.getDateCommande())
                .statut(order.getStatut())
                .total(order.getTotal())
                .adresseLivraison(order.getAdresseLivraison())
                .canal(order.getCanal())
                .clientNom(order.getClientNom())
                .clientTelephone(order.getClientTelephone())
                .referenceFacebook(order.getReferenceFacebook())
                .items(order.getItems().stream().map(item -> OrderItemDto.builder()
                        .id(item.getId())
                        .orderId(order.getId())
                        .productId(item.getProduct().getId())
                        .productNom(item.getProduct().getNom())
                        .quantite(item.getQuantite())
                        .prixUnitaire(item.getPrixUnitaire())
                        .build()).toList())
                .build();
    }
}
