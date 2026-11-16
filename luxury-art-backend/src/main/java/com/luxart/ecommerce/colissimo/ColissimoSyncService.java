package com.luxart.ecommerce.colissimo;

import com.luxart.ecommerce.colissimo.dto.ColissimoParcel;
import com.luxart.ecommerce.colissimo.dto.ColissimoSyncResultDto;
import com.luxart.ecommerce.colissimo.dto.ColissimoSyncStatusDto;
import com.luxart.ecommerce.dto.AdminNotificationDto;
import com.luxart.ecommerce.model.enums.OrderStatut;
import com.luxart.ecommerce.service.AdminNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

@Service
@RequiredArgsConstructor
@Slf4j
public class ColissimoSyncService {

    private final ColissimoProperties properties;
    private final ColissimodeliveryRestClient restClient;
    private final ColissimoSoapClient soapClient;
    private final ColissimoParcelImportService parcelImportService;
    private final AdminNotificationService notificationService;
    private final com.luxart.ecommerce.repository.OrderRepository orderRepository;
    private final com.luxart.ecommerce.service.LoyaltyService loyaltyService;

    private final AtomicReference<LocalDateTime> lastSyncAt = new AtomicReference<>();
    private final AtomicReference<ColissimoSyncResultDto> lastResult = new AtomicReference<>();

    public boolean isConfigured() {
        return (restClient != null && restClient.isConfigured())
                || (soapClient != null && soapClient.isConfigured());
    }

    public ColissimoSyncStatusDto getStatus() {
        return ColissimoSyncStatusDto.builder()
                .enabled(properties.isEnabled())
                .configured(isConfigured())
                .lastSyncAt(lastSyncAt.get())
                .lastResult(lastResult.get())
                .syncIntervalMs(properties.getSyncIntervalMs())
                .build();
    }

    public ColissimoSyncResultDto syncNow() {
        if (!isConfigured()) {
            throw new ColissimoApiException(
                    "Colissimo non configuré — activez colissimo.enabled et renseignez les identifiants API");
        }

        int created = 0;
        int updated = 0;
        int skipped = 0;
        int totalFetched = 0;
        List<String> errors = new ArrayList<>();

        // 1. Sync REST colissimodelivery.tn pour les commandes locales
        if (restClient != null && restClient.isConfigured()) {
            List<com.luxart.ecommerce.model.entity.Order> trackable = orderRepository.findTrackableOrders();
            for (com.luxart.ecommerce.model.entity.Order order : trackable) {
                String code = order.getColissimoCodeBarre();
                if (code == null || code.isBlank()) {
                    continue;
                }
                totalFetched++;
                try {
                    ColissimodeliveryRestClient.RestTrackingResult res = restClient.getEtat(code);
                    if (res != null && res.etat() != null && !res.etat().isBlank()) {
                        String oldEtat = order.getColissimoEtat();
                        OrderStatut oldStatut = order.getStatut();
                        OrderStatut newStatut = mapEtat(res.etat());

                        if (!res.etat().equalsIgnoreCase(oldEtat) || newStatut != oldStatut) {
                            order.setColissimoEtat(res.etat());
                            order.setStatut(newStatut);
                            orderRepository.save(order);
                            updated++;
                            if (oldStatut != OrderStatut.LIVREE && newStatut == OrderStatut.LIVREE) {
                                loyaltyService.onOrderDelivered(order);
                            }
                            log.info("Commande #{} mise à jour via Colissimo REST: {} -> {}",
                                    order.getId(), oldEtat, res.etat());
                        } else {
                            skipped++;
                        }
                    }
                } catch (Exception e) {
                    log.warn("Erreur suivi REST commande #{}: {}", order.getId(), e.getMessage());
                    errors.add("Cmd #" + order.getId() + " (" + code + "): " + e.getMessage());
                }
            }
        }

        // 2. Sync SOAP (historique / imports anciens colis)
        if (soapClient != null && soapClient.isConfigured()) {
            try {
                List<ColissimoParcel> parcels = soapClient.listAllParcels();
                totalFetched += parcels.size();
                for (ColissimoParcel parcel : parcels) {
                    try {
                        ColissimoImportResult result = parcelImportService.importParcel(parcel);
                        switch (result.outcome()) {
                            case CREATED -> {
                                created++;
                                notificationService.notifyColissimoParcel(result.order(), parcel, result.outcome());
                            }
                            case UPDATED -> {
                                updated++;
                                notificationService.notifyColissimoParcel(result.order(), parcel, result.outcome());
                            }
                            case SKIPPED -> skipped++;
                        }
                    } catch (Exception e) {
                        log.warn("Erreur import colis {}: {}", parcel.getCode(), e.getMessage());
                        errors.add(parcel.getCode() + ": " + e.getMessage());
                    }
                }
            } catch (Exception e) {
                log.warn("Sync SOAP ignorée ou échouée: {}", e.getMessage());
            }
        }

        ColissimoSyncResultDto result = ColissimoSyncResultDto.builder()
                .syncedAt(LocalDateTime.now())
                .totalFetched(totalFetched)
                .created(created)
                .updated(updated)
                .skipped(skipped)
                .errors(errors)
                .message(String.format(
                        "Sync terminée — %d colis récupérés, %d créés, %d mis à jour, %d ignorés%s",
                        totalFetched, created, updated, skipped,
                        errors.isEmpty() ? "" : ", " + errors.size() + " erreur(s)"))
                .build();

        lastSyncAt.set(result.getSyncedAt());
        lastResult.set(result);
        log.info(result.getMessage());

        if (!errors.isEmpty()) {
            notificationService.notify(AdminNotificationDto.builder()
                    .type("COLISSIMO_SYNC_ERROR")
                    .title("Erreurs sync Colissimo")
                    .message(String.join("\n", errors))
                    .createdAt(LocalDateTime.now().toString())
                    .build());
        }

        return result;
    }

    static OrderStatut mapEtat(String etat) {
        if (etat == null || etat.isBlank()) {
            return OrderStatut.EN_ATTENTE;
        }
        String e = etat.toLowerCase(java.util.Locale.ROOT)
                .replace("`", "")
                .replace("é", "e")
                .trim();

        if (e.contains("livre paye") || e.contains("livre")) {
            return OrderStatut.LIVREE;
        }
        if (e.contains("retour")) {
            return OrderStatut.ANNULEE;
        }
        if (e.contains("en cours")
                || e.contains("enleve")
                || e.contains("enlever")
                || e.contains("depot")
                || e.contains("anomalie")
                || e.contains("manifeste")) {
            return OrderStatut.EXPEDIEE;
        }
        if (e.contains("attente")) {
            return OrderStatut.CONFIRMEE;
        }
        return OrderStatut.EXPEDIEE;
    }
}
