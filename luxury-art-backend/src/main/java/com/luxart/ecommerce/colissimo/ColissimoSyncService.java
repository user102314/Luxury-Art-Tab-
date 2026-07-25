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
    private final ColissimoSoapClient soapClient;
    private final ColissimoParcelImportService parcelImportService;
    private final AdminNotificationService notificationService;

    private final AtomicReference<LocalDateTime> lastSyncAt = new AtomicReference<>();
    private final AtomicReference<ColissimoSyncResultDto> lastResult = new AtomicReference<>();

    public ColissimoSyncStatusDto getStatus() {
        return ColissimoSyncStatusDto.builder()
                .enabled(properties.isEnabled())
                .configured(soapClient.isConfigured())
                .lastSyncAt(lastSyncAt.get())
                .lastResult(lastResult.get())
                .syncIntervalMs(properties.getSyncIntervalMs())
                .build();
    }

    public ColissimoSyncResultDto syncNow() {
        if (!soapClient.isConfigured()) {
            throw new ColissimoApiException(
                    "Colissimo non configuré — activez colissimo.enabled et renseignez les identifiants API");
        }

        int created = 0;
        int updated = 0;
        int skipped = 0;
        List<String> errors = new ArrayList<>();

        List<ColissimoParcel> parcels;
        try {
            parcels = soapClient.listAllParcels();
        } catch (ColissimoApiException e) {
            log.error("Sync Colissimo échouée: {}", e.getMessage());
            throw e;
        }

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

        ColissimoSyncResultDto result = ColissimoSyncResultDto.builder()
                .syncedAt(LocalDateTime.now())
                .totalFetched(parcels.size())
                .created(created)
                .updated(updated)
                .skipped(skipped)
                .errors(errors)
                .message(String.format(
                        "Sync terminée — %d colis récupérés, %d créés, %d mis à jour, %d ignorés%s",
                        parcels.size(), created, updated, skipped,
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
