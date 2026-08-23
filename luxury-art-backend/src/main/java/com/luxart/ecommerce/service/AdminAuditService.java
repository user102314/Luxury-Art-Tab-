package com.luxart.ecommerce.service;

import com.luxart.ecommerce.dto.AdminAuditLogDto;
import com.luxart.ecommerce.dto.AdminAuditStatsDto;
import com.luxart.ecommerce.model.enums.AdminActionType;

import java.time.Instant;
import java.util.List;

public interface AdminAuditService {

    void logSuccess(
            AdminActionType actionType,
            String entityType,
            Long entityId,
            String productRef,
            String categoryName,
            String imageUrl,
            String imageStoragePath,
            Object requestPayload,
            Object responsePayload,
            int httpStatus
    );

    void logFailure(
            AdminActionType actionType,
            String entityType,
            Long entityId,
            String productRef,
            String categoryName,
            String imageUrl,
            String imageStoragePath,
            Object requestPayload,
            int httpStatus,
            String errorMessage
    );

    List<AdminAuditLogDto> search(
            Instant from,
            Instant to,
            AdminActionType actionType,
            String entityType,
            String productRef,
            String search
    );

    AdminAuditStatsDto stats(Instant from, Instant to);
}
