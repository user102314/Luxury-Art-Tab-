package com.luxart.ecommerce.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

/**
 * Plage de dates inclusive côté calendrier : [from, to] → [from 00:00, to+1day 00:00).
 */
public record AnalyticsPeriod(LocalDate from, LocalDate to) {

    public Instant fromInstant() {
        return from.atStartOfDay().toInstant(ZoneOffset.UTC);
    }

    public Instant toExclusiveInstant() {
        return to.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC);
    }

    public LocalDateTime fromDateTime() {
        return from.atStartOfDay();
    }

    public LocalDateTime toExclusiveDateTime() {
        return to.plusDays(1).atStartOfDay();
    }

    public static AnalyticsPeriod of(LocalDate from, LocalDate to) {
        if (from == null || to == null) {
            throw new IllegalArgumentException("Les paramètres from et to sont obligatoires");
        }
        if (to.isBefore(from)) {
            throw new IllegalArgumentException("La date 'to' doit être postérieure ou égale à 'from'");
        }
        return new AnalyticsPeriod(from, to);
    }
}
