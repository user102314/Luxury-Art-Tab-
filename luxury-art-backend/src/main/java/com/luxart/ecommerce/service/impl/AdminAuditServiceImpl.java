package com.luxart.ecommerce.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.luxart.ecommerce.audit.AdminActor;
import com.luxart.ecommerce.audit.AdminAuditContext;
import com.luxart.ecommerce.dto.*;
import com.luxart.ecommerce.model.entity.AdminAuditLog;
import com.luxart.ecommerce.model.enums.AdminActionType;
import com.luxart.ecommerce.repository.AdminAuditLogRepository;
import com.luxart.ecommerce.service.AdminAuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminAuditServiceImpl implements AdminAuditService {

    private final AdminAuditLogRepository repository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logSuccess(
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
    ) {
        persist(actionType, entityType, entityId, productRef, categoryName, imageUrl, imageStoragePath,
                requestPayload, responsePayload, httpStatus, true, null);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logFailure(
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
    ) {
        persist(actionType, entityType, entityId, productRef, categoryName, imageUrl, imageStoragePath,
                requestPayload, null, httpStatus, false, errorMessage);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminAuditLogDto> search(
            Instant from,
            Instant to,
            AdminActionType actionType,
            String entityType,
            String productRef,
            String search
    ) {
        String entity = blankToNull(entityType);
        String ref = blankToNull(productRef);
        String q = blankToNull(search);
        String qLower = q == null ? null : q.toLowerCase();

        return repository.findByCreatedAtBetweenOrderByCreatedAtDesc(from, to).stream()
                .filter(log -> actionType == null || log.getActionType() == actionType)
                .filter(log -> entity == null || entity.equalsIgnoreCase(log.getEntityType()))
                .filter(log -> ref == null || containsIgnoreCase(log.getProductRef(), ref))
                .filter(log -> qLower == null || matchesSearch(log, qLower))
                .map(this::toDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public AdminAuditStatsDto stats(Instant from, Instant to) {
        List<AdminAuditLog> logs = repository.findByCreatedAtBetweenOrderByCreatedAtDesc(from, to);

        Map<String, Long> byAction = new LinkedHashMap<>();
        for (Object[] row : repository.countByActionType(from, to)) {
            byAction.put(((AdminActionType) row[0]).name(), (Long) row[1]);
        }

        List<DuplicateRefAlertDto> duplicateCreates = repository
                .findDuplicateRefs(from, to, AdminActionType.PRODUCT_CREATE)
                .stream()
                .map(row -> DuplicateRefAlertDto.builder()
                        .productRef((String) row[0])
                        .count((Long) row[1])
                        .build())
                .toList();

        List<DuplicateRefAlertDto> duplicateUploads = repository
                .findDuplicateRefs(from, to, AdminActionType.PRODUCT_IMAGE_UPLOAD)
                .stream()
                .map(row -> DuplicateRefAlertDto.builder()
                        .productRef((String) row[0])
                        .count((Long) row[1])
                        .build())
                .toList();

        Map<String, long[]> counts = new HashMap<>();
        Map<String, Long> ids = new HashMap<>();
        for (AdminAuditLog log : logs) {
            if (log.getProductRef() == null) continue;
            String key = log.getProductRef();
            if (log.getEntityId() != null) ids.put(key, log.getEntityId());
            long[] c = counts.computeIfAbsent(key, k -> new long[3]);
            switch (log.getActionType()) {
                case PRODUCT_IMAGE_UPLOAD -> c[0]++;
                case PRODUCT_CREATE -> c[1]++;
                case PRODUCT_UPDATE -> c[2]++;
                default -> { /* ignore */ }
            }
        }

        List<ProductActivityDto> topActivity = counts.entrySet().stream()
                .map(e -> ProductActivityDto.builder()
                        .productRef(e.getKey())
                        .productId(ids.get(e.getKey()))
                        .uploadCount(e.getValue()[0])
                        .createCount(e.getValue()[1])
                        .updateCount(e.getValue()[2])
                        .build())
                .sorted(Comparator.comparingLong(
                        (ProductActivityDto p) -> p.getUploadCount() + p.getCreateCount() + p.getUpdateCount())
                        .reversed())
                .limit(10)
                .toList();

        return AdminAuditStatsDto.builder()
                .totalLogs(logs.size())
                .failureCount(repository.countByCreatedAtBetweenAndSuccessFalse(from, to))
                .byActionType(byAction)
                .duplicateCreates(duplicateCreates)
                .duplicateUploads(duplicateUploads)
                .topProductActivity(topActivity)
                .build();
    }

    private void persist(
            AdminActionType actionType,
            String entityType,
            Long entityId,
            String productRef,
            String categoryName,
            String imageUrl,
            String imageStoragePath,
            Object requestPayload,
            Object responsePayload,
            int httpStatus,
            boolean success,
            String errorMessage
    ) {
        AdminActor actor = AdminAuditContext.get();
        AdminAuditLog entry = AdminAuditLog.builder()
                .actionType(actionType)
                .entityType(entityType)
                .entityId(entityId)
                .productRef(productRef)
                .categoryName(categoryName)
                .imageUrl(imageUrl)
                .imageStoragePath(imageStoragePath)
                .requestPath(actor != null ? actor.requestPath() : null)
                .httpMethod(actor != null ? actor.httpMethod() : null)
                .httpStatus(httpStatus)
                .success(success)
                .requestPayload(toJson(requestPayload))
                .responsePayload(toJson(responsePayload))
                .errorMessage(errorMessage)
                .adminEmail(actor != null ? actor.email() : null)
                .adminName(actor != null ? actor.name() : null)
                .clientIp(actor != null ? actor.ip() : null)
                .build();

        try {
            repository.save(entry);
        } catch (Exception ex) {
            log.warn("Impossible d'enregistrer le log admin: {}", ex.getMessage());
        }
    }

    private AdminAuditLogDto toDto(AdminAuditLog log) {
        return AdminAuditLogDto.builder()
                .id(log.getId())
                .actionType(log.getActionType())
                .entityType(log.getEntityType())
                .entityId(log.getEntityId())
                .productRef(log.getProductRef())
                .categoryName(log.getCategoryName())
                .imageUrl(log.getImageUrl())
                .imageStoragePath(log.getImageStoragePath())
                .requestPath(log.getRequestPath())
                .httpMethod(log.getHttpMethod())
                .httpStatus(log.getHttpStatus())
                .success(log.getSuccess())
                .requestPayload(log.getRequestPayload())
                .responsePayload(log.getResponsePayload())
                .errorMessage(log.getErrorMessage())
                .adminEmail(log.getAdminEmail())
                .adminName(log.getAdminName())
                .clientIp(log.getClientIp())
                .createdAt(log.getCreatedAt())
                .build();
    }

    private String toJson(Object value) {
        if (value == null) return null;
        if (value instanceof String s) return s;
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            return String.valueOf(value);
        }
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static boolean containsIgnoreCase(String value, String needle) {
        return value != null && value.toLowerCase().contains(needle.toLowerCase());
    }

    private static boolean matchesSearch(AdminAuditLog log, String qLower) {
        return contains(log.getProductRef(), qLower)
                || contains(log.getCategoryName(), qLower)
                || contains(log.getImageUrl(), qLower)
                || contains(log.getImageStoragePath(), qLower)
                || contains(log.getRequestPath(), qLower)
                || contains(log.getResponsePayload(), qLower)
                || contains(log.getRequestPayload(), qLower)
                || contains(log.getAdminEmail(), qLower)
                || contains(log.getAdminName(), qLower)
                || contains(log.getErrorMessage(), qLower);
    }

    private static boolean contains(String value, String qLower) {
        return value != null && value.toLowerCase().contains(qLower);
    }
}
