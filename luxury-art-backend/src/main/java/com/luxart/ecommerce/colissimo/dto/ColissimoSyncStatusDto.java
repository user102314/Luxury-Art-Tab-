package com.luxart.ecommerce.colissimo.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ColissimoSyncStatusDto {

    private final boolean enabled;
    private final boolean configured;
    private final LocalDateTime lastSyncAt;
    private final ColissimoSyncResultDto lastResult;
    private final long syncIntervalMs;
}
