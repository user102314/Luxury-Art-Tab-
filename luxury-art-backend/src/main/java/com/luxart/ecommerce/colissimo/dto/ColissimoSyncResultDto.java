package com.luxart.ecommerce.colissimo.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Builder
public class ColissimoSyncResultDto {

    private final LocalDateTime syncedAt;
    private final int totalFetched;
    private final int created;
    private final int updated;
    private final int skipped;
    @Builder.Default
    private final List<String> errors = new ArrayList<>();
    private final String message;
}
