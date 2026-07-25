package com.luxart.ecommerce.colissimo;

import com.luxart.ecommerce.model.entity.Order;

public record ColissimoImportResult(
        ColissimoParcelImportService.ImportOutcome outcome,
        Order order) {
}
