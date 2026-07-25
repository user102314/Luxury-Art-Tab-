package com.luxart.ecommerce.colissimo;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ColissimoSyncScheduler {

    private final ColissimoProperties properties;
    private final ColissimoSyncService syncService;

    @Scheduled(
            fixedDelayString = "${colissimo.sync-interval-ms:300000}",
            initialDelayString = "${colissimo.sync-initial-delay-ms:30000}")
    public void scheduledSync() {
        if (!properties.isEnabled()) {
            return;
        }
        try {
            syncService.syncNow();
        } catch (Exception e) {
            log.warn("Synchronisation Colissimo automatique échouée: {}", e.getMessage());
        }
    }
}
