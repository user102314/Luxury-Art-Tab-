package com.luxart.ecommerce.colissimo;

import com.luxart.ecommerce.colissimo.dto.ColissimoParcel;
import com.luxart.ecommerce.colissimo.dto.ColissimoTrackingDto;
import com.luxart.ecommerce.colissimo.dto.ColissimoTrackingStepDto;
import com.luxart.ecommerce.colissimo.dto.ColissimoTrackingSummaryDto;
import com.luxart.ecommerce.exception.ResourceNotFoundException;
import com.luxart.ecommerce.model.entity.Order;
import com.luxart.ecommerce.model.enums.OrderStatut;
import com.luxart.ecommerce.repository.OrderRepository;
import com.luxart.ecommerce.service.LoyaltyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class ColissimoTrackingService {

    private static final String TRANSPORTEUR = "Colissimo Tunisie";

    private final ColissimoSoapClient soapClient;
    private final ColissimoShipmentService shipmentService;
    private final OrderRepository orderRepository;
    private final LoyaltyService loyaltyService;

    @Transactional(readOnly = true)
    public List<ColissimoTrackingSummaryDto> listTrackableOrders() {
        return orderRepository.findTrackableOrders().stream()
                .filter(this::hasTrackingCode)
                .map(this::toSummary)
                .toList();
    }

    @Transactional
    public ColissimoTrackingDto getTracking(Long orderId, boolean refresh) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Commande introuvable: " + orderId));

        if (!hasTrackingCode(order)) {
            throw new ColissimoApiException(
                    "Cette commande n'a pas encore de colis Colissimo associé");
        }

        ColissimoParcel parcel = null;
        boolean live = false;

        if (refresh && soapClient.isConfigured()) {
            String code = shipmentService.resolveCodeBarre(order);
            try {
                parcel = soapClient.getParcel(code);
                applyParcelToOrder(order, parcel);
                orderRepository.save(order);
                live = true;
            } catch (ColissimoApiException e) {
                log.warn("Impossible de rafraîchir le suivi Colissimo pour commande #{}: {}",
                        orderId, e.getMessage());
            }
        }

        return buildTrackingDto(order, parcel, live);
    }

    private boolean hasTrackingCode(Order order) {
        String code = shipmentService.resolveCodeBarre(order);
        return code != null && !code.isBlank();
    }

    private void applyParcelToOrder(Order order, ColissimoParcel parcel) {
        if (parcel == null) {
            return;
        }

        OrderStatut previous = order.getStatut();
        OrderStatut newStatut = ColissimoSyncService.mapEtat(parcel.getEtat());

        if (parcel.getEtat() != null) {
            order.setColissimoEtat(parcel.getEtat());
        }
        if (parcel.getAgenceActuelle() != null) {
            order.setColissimoAgence(parcel.getAgenceActuelle());
        }
        if (parcel.getNumManifeste() != null) {
            order.setColissimoManifeste(parcel.getNumManifeste());
        }
        if (parcel.getDesignation() != null) {
            order.setColissimoDesignation(parcel.getDesignation());
        }
        if (newStatut != previous) {
            order.setStatut(newStatut);
            if (previous != OrderStatut.LIVREE && newStatut == OrderStatut.LIVREE) {
                loyaltyService.onOrderDelivered(order);
            }
        }
    }

    private ColissimoTrackingSummaryDto toSummary(Order order) {
        return ColissimoTrackingSummaryDto.builder()
                .orderId(order.getId())
                .orderStatut(order.getStatut())
                .canal(order.getCanal())
                .clientNom(resolveClientName(order))
                .dateCommande(order.getDateCommande())
                .codeBarre(shipmentService.resolveCodeBarre(order))
                .etat(order.getColissimoEtat())
                .etatLabel(formatEtatLabel(order.getColissimoEtat()))
                .agenceActuelle(order.getColissimoAgence())
                .designation(order.getColissimoDesignation())
                .build();
    }

    private ColissimoTrackingDto buildTrackingDto(Order order, ColissimoParcel parcel, boolean live) {
        String etat = parcel != null && parcel.getEtat() != null
                ? parcel.getEtat()
                : order.getColissimoEtat();

        return ColissimoTrackingDto.builder()
                .orderId(order.getId())
                .orderStatut(order.getStatut())
                .canal(order.getCanal())
                .clientNom(resolveClientName(order))
                .clientTelephone(order.getClientTelephone())
                .dateCommande(order.getDateCommande())
                .codeBarre(shipmentService.resolveCodeBarre(order))
                .reference(firstNonBlank(
                        parcel != null ? parcel.getReference() : null,
                        order.getColissimoReference()))
                .etat(etat)
                .etatLabel(formatEtatLabel(etat))
                .transporteur(TRANSPORTEUR)
                .agenceActuelle(firstNonBlank(
                        parcel != null ? parcel.getAgenceActuelle() : null,
                        order.getColissimoAgence()))
                .numManifeste(firstNonBlank(
                        parcel != null ? parcel.getNumManifeste() : null,
                        order.getColissimoManifeste()))
                .numPaiement(parcel != null ? parcel.getNumPaiement() : null)
                .adresse(firstNonBlank(
                        parcel != null ? parcel.getAdresse() : null,
                        order.getAdresseLivraison()))
                .ville(parcel != null ? parcel.getVille() : null)
                .gouvernorat(parcel != null ? parcel.getGouvernorat() : null)
                .tel1(firstNonBlank(
                        parcel != null ? parcel.getTel1() : null,
                        order.getClientTelephone()))
                .designation(firstNonBlank(
                        parcel != null ? parcel.getDesignation() : null,
                        order.getColissimoDesignation()))
                .prix(parcel != null ? parcel.getPrix() : order.getTotal())
                .nbPieces(parcel != null ? parcel.getNbPieces() : null)
                .dateCreation(parcel != null ? parcel.getDateCreation() : null)
                .type(parcel != null ? parcel.getType() : null)
                .commentaire(parcel != null ? parcel.getCommentaire() : null)
                .liveFromApi(live)
                .timeline(buildTimeline(etat))
                .build();
    }

    static List<ColissimoTrackingStepDto> buildTimeline(String etat) {
        int currentIndex = resolveStepIndex(etat);
        boolean isReturn = normalizeEtat(etat).contains("retour");

        List<ColissimoTrackingStepDto> steps = new ArrayList<>();
        String[][] defs = isReturn
                ? new String[][]{
                {"registered", "Colis enregistré", "Le colis a été créé chez Colissimo"},
                {"picked", "Enlevé", "Le colis a été récupéré par le transporteur"},
                {"depot", "En dépôt", "Le colis est au centre de tri"},
                {"returned", "Retour", "Le colis est en cours de retour"},
        }
                : new String[][]{
                {"registered", "Colis enregistré", "Le colis a été créé chez Colissimo"},
                {"picked", "Enlevé", "Le colis a été récupéré par le transporteur"},
                {"depot", "En dépôt", "Le colis est arrivé au centre de tri"},
                {"manifest", "Manifesté", "Le colis est intégré à une tournée de livraison"},
                {"transit", "En cours de livraison", "Le colis est en cours de distribution"},
                {"delivered", "Livré", "Le colis a été remis au destinataire"},
        };

        for (int i = 0; i < defs.length; i++) {
            String status;
            if (i < currentIndex) {
                status = "completed";
            } else if (i == currentIndex) {
                status = "current";
            } else {
                status = "pending";
            }
            steps.add(ColissimoTrackingStepDto.builder()
                    .key(defs[i][0])
                    .label(defs[i][1])
                    .description(defs[i][2])
                    .status(status)
                    .build());
        }

        return steps;
    }

    static int resolveStepIndex(String etat) {
        String e = normalizeEtat(etat);
        if (e.isBlank()) {
            return 0;
        }
        if (e.contains("retour")) {
            return 3;
        }
        if (e.contains("livre")) {
            return 5;
        }
        if (e.contains("cours") || e.contains("livraison")) {
            return 4;
        }
        if (e.contains("manifeste")) {
            return 3;
        }
        if (e.contains("depot") || e.contains("anomalie")) {
            return 2;
        }
        if (e.contains("enleve") || e.contains("enlever")) {
            return 1;
        }
        if (e.contains("attente")) {
            return 0;
        }
        return 4;
    }

    static String formatEtatLabel(String etat) {
        if (etat == null || etat.isBlank()) {
            return "En attente";
        }
        return etat.trim();
    }

    private static String normalizeEtat(String etat) {
        if (etat == null) {
            return "";
        }
        return etat.toLowerCase(Locale.ROOT)
                .replace("`", "")
                .replace("é", "e")
                .replace("è", "e")
                .trim();
    }

    private static String resolveClientName(Order order) {
        if (order.getClientNom() != null && !order.getClientNom().isBlank()) {
            return order.getClientNom().trim();
        }
        if (order.getUser() != null && order.getUser().getNom() != null) {
            return order.getUser().getNom();
        }
        return "Client";
    }

    private static String firstNonBlank(String... values) {
        for (String v : values) {
            if (v != null && !v.isBlank()) {
                return v.trim();
            }
        }
        return null;
    }
}
