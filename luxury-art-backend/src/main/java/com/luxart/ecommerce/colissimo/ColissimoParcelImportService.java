package com.luxart.ecommerce.colissimo;

import com.luxart.ecommerce.colissimo.dto.ColissimoParcel;
import com.luxart.ecommerce.model.entity.ClientProfile;
import com.luxart.ecommerce.model.entity.Order;
import com.luxart.ecommerce.model.entity.User;
import com.luxart.ecommerce.model.enums.OrderCanal;
import com.luxart.ecommerce.model.enums.OrderStatut;
import com.luxart.ecommerce.model.enums.Role;
import com.luxart.ecommerce.repository.ClientProfileRepository;
import com.luxart.ecommerce.repository.OrderRepository;
import com.luxart.ecommerce.repository.UserRepository;
import com.luxart.ecommerce.service.LoyaltyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

/**
 * Import d'un colis Colissimo dans une transaction isolée
 * (évite le rollback global et l'erreur 500 sur sync).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ColissimoParcelImportService {

    private static final String COLISSIMO_DOMAIN = "@colissimo.luxart.local";

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final LoyaltyService loyaltyService;

    public enum ImportOutcome { CREATED, UPDATED, SKIPPED }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public ColissimoImportResult importParcel(ColissimoParcel parcel) {
        if (parcel.getCode() == null || parcel.getCode().isBlank()) {
            return new ColissimoImportResult(ImportOutcome.SKIPPED, null);
        }

        Optional<Order> existing = orderRepository.findByColissimoCodeBarre(parcel.getCode());
        if (existing.isEmpty()) {
            existing = orderRepository.findByNumeroColis(parcel.getCode());
        }

        if (existing.isPresent()) {
            Order order = existing.get();
            if (linkColissimoCodeIfMissing(order, parcel)) {
                return new ColissimoImportResult(ImportOutcome.UPDATED, orderRepository.save(order));
            }
            if (updateExistingOrder(order, parcel)) {
                return new ColissimoImportResult(ImportOutcome.UPDATED, order);
            }
            return new ColissimoImportResult(ImportOutcome.SKIPPED, order);
        }

        Order created = createOrderFromParcel(parcel);
        return new ColissimoImportResult(ImportOutcome.CREATED, created);
    }

    private boolean linkColissimoCodeIfMissing(Order order, ColissimoParcel parcel) {
        if (order.getColissimoCodeBarre() != null && !order.getColissimoCodeBarre().isBlank()) {
            return false;
        }
        order.setColissimoCodeBarre(parcel.getCode());
        order.setNumeroColis(parcel.getCode());
        order.setColissimoEtat(parcel.getEtat());
        order.setColissimoReference(parcel.getReference());
        order.setColissimoDesignation(parcel.getDesignation());
        if (order.getColissimoImportedAt() == null) {
            order.setColissimoImportedAt(LocalDateTime.now());
        }
        orderRepository.save(order);
        return true;
    }

    private Order createOrderFromParcel(ColissimoParcel parcel) {
        ChannelInfo channel = inferChannel(parcel.getReference());
        User user = resolveClient(parcel, channel.canal());

        String adresse = buildAddress(parcel);
        OrderStatut statut = ColissimoSyncService.mapEtat(parcel.getEtat());

        Order order = Order.builder()
                .user(user)
                .dateCommande(parseDateCreation(parcel.getDateCreation()))
                .statut(statut)
                .total(parcel.getPrix() != null ? parcel.getPrix() : BigDecimal.ZERO)
                .adresseLivraison(adresse)
                .canal(channel.canal())
                .clientNom(safeClientName(parcel.getClient()))
                .clientTelephone(parcel.getTel1())
                .numeroColis(parcel.getCode())
                .colissimoCodeBarre(parcel.getCode())
                .colissimoReference(parcel.getReference())
                .colissimoEtat(parcel.getEtat())
                .colissimoDesignation(parcel.getDesignation())
                .colissimoImportedAt(LocalDateTime.now())
                .stockDeduit(false)
                .build();

        applyChannelReference(order, channel, parcel.getReference());
        order = orderRepository.save(order);

        if (statut == OrderStatut.LIVREE) {
            loyaltyService.onOrderDelivered(order);
        }

        return order;
    }

    private boolean updateExistingOrder(Order order, ColissimoParcel parcel) {
        OrderStatut previous = order.getStatut();
        OrderStatut newStatut = ColissimoSyncService.mapEtat(parcel.getEtat());
        boolean changed = false;

        if (parcel.getEtat() != null && !parcel.getEtat().equals(order.getColissimoEtat())) {
            order.setColissimoEtat(parcel.getEtat());
            changed = true;
        }

        if (newStatut != previous) {
            order.setStatut(newStatut);
            changed = true;
        }

        if (parcel.getPrix() != null
                && (order.getTotal() == null || order.getTotal().compareTo(parcel.getPrix()) != 0)) {
            order.setTotal(parcel.getPrix());
            changed = true;
        }

        if (parcel.getClient() != null && !parcel.getClient().equals(order.getClientNom())) {
            order.setClientNom(parcel.getClient());
            changed = true;
        }

        if (parcel.getTel1() != null && !parcel.getTel1().equals(order.getClientTelephone())) {
            order.setClientTelephone(parcel.getTel1());
            changed = true;
        }

        if (!changed) {
            return false;
        }

        orderRepository.save(order);

        if (previous != OrderStatut.LIVREE && newStatut == OrderStatut.LIVREE) {
            loyaltyService.onOrderDelivered(order);
        }

        return true;
    }

    private User resolveClient(ColissimoParcel parcel, OrderCanal canal) {
        if (parcel.getTel1() != null && !parcel.getTel1().isBlank()) {
            var profile = clientProfileRepository.findFirstByTelephone(parcel.getTel1().trim());
            if (profile.isPresent()) {
                return profile.get().getUser();
            }
        }

        String uniqueEmail = "colissimo-" + parcel.getCode().trim() + COLISSIMO_DOMAIN;
        var byUnique = userRepository.findByEmail(uniqueEmail);
        if (byUnique.isPresent()) {
            return byUnique.get();
        }

        String sharedEmail = buildSharedEmail(parcel, canal);
        var byShared = userRepository.findByEmail(sharedEmail);
        if (byShared.isPresent()) {
            return byShared.get();
        }

        User user = userRepository.save(User.builder()
                .nom(safeClientName(parcel.getClient()))
                .email(uniqueEmail)
                .motDePasse(UUID.randomUUID().toString())
                .role(Role.CLIENT)
                .build());

        if (parcel.getTel1() != null && !parcel.getTel1().isBlank()) {
            clientProfileRepository.save(ClientProfile.builder()
                    .user(user)
                    .telephone(parcel.getTel1().trim())
                    .build());
        }

        return user;
    }

    private static String safeClientName(String name) {
        if (name != null && !name.isBlank()) {
            return name.trim();
        }
        return "Client Colissimo";
    }

    private String buildSharedEmail(ColissimoParcel parcel, OrderCanal canal) {
        String domain = switch (canal) {
            case FACEBOOK -> "@facebook.luxart.local";
            case INSTAGRAM -> "@instagram.luxart.local";
            case WHATSAPP -> "@whatsapp.luxart.local";
            default -> COLISSIMO_DOMAIN;
        };
        String key = (parcel.getTel1() != null ? parcel.getTel1() : "")
                + (parcel.getClient() != null ? parcel.getClient() : "")
                + parcel.getCode();
        String slug = key.replaceAll("[^a-zA-Z0-9]", "").toLowerCase(Locale.ROOT);
        if (slug.length() > 40) {
            slug = slug.substring(0, 40);
        }
        if (slug.isEmpty()) {
            slug = UUID.randomUUID().toString().substring(0, 8);
        }
        return slug + domain;
    }

    private record ChannelInfo(OrderCanal canal, String normalizedRef) {}

    private ChannelInfo inferChannel(String reference) {
        if (reference == null || reference.isBlank()) {
            return new ChannelInfo(OrderCanal.FACEBOOK, null);
        }

        String ref = reference.trim().toLowerCase(Locale.ROOT);
        if (ref.contains("inst") || ref.contains("ig") || ref.contains("instagram")) {
            return new ChannelInfo(OrderCanal.INSTAGRAM, reference.trim());
        }
        if (ref.contains("wa") || ref.contains("whatsapp") || ref.contains("whats")) {
            return new ChannelInfo(OrderCanal.WHATSAPP, reference.trim());
        }
        if (ref.contains("fb") || ref.contains("fc") || ref.contains("facebook")) {
            return new ChannelInfo(OrderCanal.FACEBOOK, reference.trim());
        }
        if (ref.contains("web") || ref.contains("site")) {
            return new ChannelInfo(OrderCanal.SITE_WEB, reference.trim());
        }

        return new ChannelInfo(OrderCanal.FACEBOOK, reference.trim());
    }

    private void applyChannelReference(Order order, ChannelInfo channel, String reference) {
        if (reference == null || reference.isBlank()) {
            return;
        }
        switch (channel.canal()) {
            case INSTAGRAM -> order.setReferenceInstagram(reference);
            case WHATSAPP -> order.setReferenceWhatsapp(reference);
            case FACEBOOK -> order.setReferenceFacebook(reference);
            default -> order.setColissimoReference(reference);
        }
    }

    private static String buildAddress(ColissimoParcel parcel) {
        StringBuilder sb = new StringBuilder();
        if (parcel.getAdresse() != null && !parcel.getAdresse().isBlank()) {
            sb.append(parcel.getAdresse().trim());
        }
        if (parcel.getVille() != null && !parcel.getVille().isBlank()) {
            if (!sb.isEmpty()) sb.append(", ");
            sb.append(parcel.getVille().trim());
        }
        if (parcel.getGouvernorat() != null && !parcel.getGouvernorat().isBlank()) {
            if (!sb.isEmpty()) sb.append(", ");
            sb.append(parcel.getGouvernorat().trim());
        }
        if (parcel.getDesignation() != null && !parcel.getDesignation().isBlank()) {
            if (!sb.isEmpty()) sb.append("\n");
            sb.append("Article: ").append(parcel.getDesignation().trim());
        }
        if (parcel.getCommentaire() != null && !parcel.getCommentaire().isBlank()) {
            if (!sb.isEmpty()) sb.append("\n");
            sb.append("Note: ").append(parcel.getCommentaire().trim());
        }
        return !sb.isEmpty() ? sb.toString() : "Adresse Colissimo";
    }

    private static LocalDateTime parseDateCreation(String raw) {
        if (raw == null || raw.isBlank()) {
            return LocalDateTime.now();
        }
        String normalized = raw.trim().replace(" T", "T").replace(" ", "T");
        DateTimeFormatter[] formatters = {
                DateTimeFormatter.ISO_LOCAL_DATE_TIME,
                DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS"),
                DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")
        };
        for (DateTimeFormatter formatter : formatters) {
            try {
                return LocalDateTime.parse(normalized, formatter);
            } catch (DateTimeParseException ignored) {
            }
        }
        return LocalDateTime.now();
    }
}
