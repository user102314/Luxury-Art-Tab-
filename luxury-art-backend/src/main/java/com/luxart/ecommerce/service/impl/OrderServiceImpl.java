package com.luxart.ecommerce.service.impl;

import com.luxart.ecommerce.dto.*;
import com.luxart.ecommerce.event.OrderCreatedEvent;
import com.luxart.ecommerce.exception.ResourceNotFoundException;
import com.luxart.ecommerce.colissimo.ColissimoShipmentService;
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
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private static final String FACEBOOK_DOMAIN = "@facebook.luxart.local";
    private static final String INSTAGRAM_DOMAIN = "@instagram.luxart.local";
    private static final String WHATSAPP_DOMAIN = "@whatsapp.luxart.local";

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final LoyaltyService loyaltyService;
    private final StockService stockService;
    private final ApplicationEventPublisher eventPublisher;
    private final ColissimoShipmentService colissimoShipmentService;

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
        OrderDto created = toDto(orderRepository.save(order));
        eventPublisher.publishEvent(new OrderCreatedEvent(created));
        return created;
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
        finalizeConfirmedOrder(order);
        order = orderRepository.save(order);

        if (order.getStatut() == OrderStatut.LIVREE) {
            loyaltyService.onOrderDelivered(order);
        }

        OrderDto result = toDto(order);
        eventPublisher.publishEvent(new OrderCreatedEvent(result));
        return result;
    }

    @Override
    @Transactional
    public OrderDto createInstagramOrder(InstagramOrderCreateDto dto) {
        User user = resolveInstagramClient(dto);

        BigDecimal total = BigDecimal.ZERO;
        for (InstagramOrderCreateDto.LineItem line : dto.getItems()) {
            Product product = stockService.getProductOrThrow(line.getProductId());
            BigDecimal unit = line.getPrixUnitaire() != null ? line.getPrixUnitaire() : product.getPrix();
            total = total.add(unit.multiply(BigDecimal.valueOf(line.getQuantite())));
        }

        Order order = Order.builder()
                .user(user)
                .statut(dto.getStatut() != null ? dto.getStatut() : OrderStatut.EN_ATTENTE)
                .total(total)
                .adresseLivraison(dto.getAdresseLivraison())
                .canal(OrderCanal.INSTAGRAM)
                .clientNom(dto.getClientNom().trim())
                .clientTelephone(dto.getClientTelephone())
                .referenceInstagram(dto.getReferenceInstagram())
                .stockDeduit(false)
                .build();
        order = orderRepository.save(order);

        for (InstagramOrderCreateDto.LineItem line : dto.getItems()) {
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
        finalizeConfirmedOrder(order);
        order = orderRepository.save(order);

        if (order.getStatut() == OrderStatut.LIVREE) {
            loyaltyService.onOrderDelivered(order);
        }

        OrderDto result = toDto(order);
        eventPublisher.publishEvent(new OrderCreatedEvent(result));
        return result;
    }

    @Override
    @Transactional
    public OrderDto createWhatsAppOrder(WhatsAppOrderCreateDto dto) {
        User user = resolveWhatsAppClient(dto);

        BigDecimal total = BigDecimal.ZERO;
        for (WhatsAppOrderCreateDto.LineItem line : dto.getItems()) {
            Product product = stockService.getProductOrThrow(line.getProductId());
            BigDecimal unit = line.getPrixUnitaire() != null ? line.getPrixUnitaire() : product.getPrix();
            total = total.add(unit.multiply(BigDecimal.valueOf(line.getQuantite())));
        }

        Order order = Order.builder()
                .user(user)
                .statut(dto.getStatut() != null ? dto.getStatut() : OrderStatut.EN_ATTENTE)
                .total(total)
                .adresseLivraison(dto.getAdresseLivraison())
                .canal(OrderCanal.WHATSAPP)
                .clientNom(dto.getClientNom().trim())
                .clientTelephone(dto.getClientTelephone())
                .referenceWhatsapp(dto.getReferenceWhatsapp())
                .stockDeduit(false)
                .build();
        order = orderRepository.save(order);

        for (WhatsAppOrderCreateDto.LineItem line : dto.getItems()) {
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
        finalizeConfirmedOrder(order);
        order = orderRepository.save(order);

        if (order.getStatut() == OrderStatut.LIVREE) {
            loyaltyService.onOrderDelivered(order);
        }

        OrderDto result = toDto(order);
        eventPublisher.publishEvent(new OrderCreatedEvent(result));
        return result;
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
        if (dto.getReferenceInstagram() != null) order.setReferenceInstagram(dto.getReferenceInstagram());
        if (dto.getReferenceWhatsapp() != null) order.setReferenceWhatsapp(dto.getReferenceWhatsapp());
        if (dto.getNumeroColis() != null && !dto.getNumeroColis().isBlank()) {
            order.setNumeroColis(dto.getNumeroColis().trim());
        }

        finalizeConfirmedOrder(order);
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
        BigDecimal caInstagram = BigDecimal.ZERO;
        BigDecimal caWhatsapp = BigDecimal.ZERO;
        BigDecimal caSite = BigDecimal.ZERO;
        long fbTotal = 0, igTotal = 0, waTotal = 0, webTotal = 0;
        long fbLiv = 0, igLiv = 0, waLiv = 0, webLiv = 0;

        for (Order o : all) {
            OrderCanal canal = o.getCanal() != null ? o.getCanal() : OrderCanal.SITE_WEB;
            switch (canal) {
                case FACEBOOK -> fbTotal++;
                case INSTAGRAM -> igTotal++;
                case WHATSAPP -> waTotal++;
                default -> webTotal++;
            }

            if (o.getStatut() == OrderStatut.LIVREE) {
                BigDecimal amount = o.getTotal() != null ? o.getTotal() : BigDecimal.ZERO;
                switch (canal) {
                    case FACEBOOK -> {
                        fbLiv++;
                        caFacebook = caFacebook.add(amount);
                    }
                    case INSTAGRAM -> {
                        igLiv++;
                        caInstagram = caInstagram.add(amount);
                    }
                    case WHATSAPP -> {
                        waLiv++;
                        caWhatsapp = caWhatsapp.add(amount);
                    }
                    default -> {
                        webLiv++;
                        caSite = caSite.add(amount);
                    }
                }
            }
        }

        return OrderChannelStatsDto.builder()
                .totalFacebook(fbTotal)
                .totalInstagram(igTotal)
                .totalWhatsapp(waTotal)
                .totalSiteWeb(webTotal)
                .facebookLivrees(fbLiv)
                .instagramLivrees(igLiv)
                .whatsappLivrees(waLiv)
                .siteWebLivrees(webLiv)
                .caFacebook(caFacebook)
                .caInstagram(caInstagram)
                .caWhatsapp(caWhatsapp)
                .caSiteWeb(caSite)
                .caTotal(caFacebook.add(caInstagram).add(caWhatsapp).add(caSite))
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

    private User resolveInstagramClient(InstagramOrderCreateDto dto) {
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
            var igUser = userRepository.findByEmail(buildInstagramEmail(dto.getClientTelephone(), dto.getClientNom()));
            if (igUser.isPresent()) {
                return igUser.get();
            }
        }

        String email = buildInstagramEmail(
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

    private User resolveWhatsAppClient(WhatsAppOrderCreateDto dto) {
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
            var waUser = userRepository.findByEmail(buildWhatsAppEmail(dto.getClientTelephone(), dto.getClientNom()));
            if (waUser.isPresent()) {
                return waUser.get();
            }
        }

        String email = buildWhatsAppEmail(
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
        return buildChannelEmail(key, nom, FACEBOOK_DOMAIN);
    }

    private String buildInstagramEmail(String key, String nom) {
        return buildChannelEmail(key, nom, INSTAGRAM_DOMAIN);
    }

    private String buildWhatsAppEmail(String key, String nom) {
        return buildChannelEmail(key, nom, WHATSAPP_DOMAIN);
    }

    private String buildChannelEmail(String key, String nom, String domain) {
        String slug = (key + nom).replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
        if (slug.length() > 40) slug = slug.substring(0, 40);
        if (slug.isEmpty()) slug = UUID.randomUUID().toString().substring(0, 8);
        return slug + domain;
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
        String telephone = order.getClientTelephone();
        if (telephone == null || telephone.isBlank()) {
            telephone = extractPhoneFromAddress(order.getAdresseLivraison());
        }
        if ((telephone == null || telephone.isBlank()) && order.getUser() != null) {
            telephone = clientProfileRepository.findByUserId(order.getUser().getId())
                    .map(ClientProfile::getTelephone)
                    .orElse(null);
        }
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
                .clientTelephone(telephone)
                .referenceFacebook(order.getReferenceFacebook())
                .referenceInstagram(order.getReferenceInstagram())
                .referenceWhatsapp(order.getReferenceWhatsapp())
                .numeroColis(order.getNumeroColis())
                .colissimoCodeBarre(order.getColissimoCodeBarre())
                .colissimoReference(order.getColissimoReference())
                .colissimoEtat(order.getColissimoEtat())
                .colissimoDesignation(order.getColissimoDesignation())
                .colissimoImportedAt(order.getColissimoImportedAt())
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

    /** Récupère un n° collé dans l'adresse (anciennes commandes site : "Tél: 06…"). */
    private static String extractPhoneFromAddress(String adresse) {
        if (adresse == null || adresse.isBlank()) return null;
        var matcher = java.util.regex.Pattern
                .compile("(?i)(?:t[ée]l(?:[ée]phone)?|phone)\\s*[: ]\\s*([+\\d][\\d\\s.\\-]{5,})", java.util.regex.Pattern.MULTILINE)
                .matcher(adresse);
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        return null;
    }

    /**
     * À la confirmation : création du colis Colissimo puis numéro de suivi.
     */
    private void finalizeConfirmedOrder(Order order) {
        OrderStatut s = order.getStatut();
        if (s != OrderStatut.CONFIRMEE && s != OrderStatut.EXPEDIEE && s != OrderStatut.LIVREE) {
            return;
        }
        colissimoShipmentService.pushOrderIfNeeded(order);
        ensureNumeroColis(order);
    }

    /**
     * Génère un numéro de colis interne si Colissimo n'a pas fourni de code à barre.
     * Format: LX-YYYYMMDD-XXXXX (unique par commande).
     */
    private void ensureNumeroColis(Order order) {
        if (order.getColissimoCodeBarre() != null && !order.getColissimoCodeBarre().isBlank()) {
            order.setNumeroColis(order.getColissimoCodeBarre());
            return;
        }
        if (order.getNumeroColis() != null && !order.getNumeroColis().isBlank()) {
            return;
        }
        OrderStatut s = order.getStatut();
        if (s != OrderStatut.CONFIRMEE && s != OrderStatut.EXPEDIEE && s != OrderStatut.LIVREE) {
            return;
        }
        String datePart = java.time.LocalDate.now()
                .format(java.time.format.DateTimeFormatter.BASIC_ISO_DATE);
        String suffix = String.format("%05d", order.getId() != null ? order.getId() % 100000 : 0);
        String rand = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        order.setNumeroColis("LX-" + datePart + "-" + suffix + rand);
    }
}
