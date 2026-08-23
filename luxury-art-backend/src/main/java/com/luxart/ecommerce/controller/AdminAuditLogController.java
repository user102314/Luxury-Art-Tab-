package com.luxart.ecommerce.controller;

import com.luxart.ecommerce.dto.AdminAuditLogDto;
import com.luxart.ecommerce.dto.AdminAuditStatsDto;
import com.luxart.ecommerce.model.enums.AdminActionType;
import com.luxart.ecommerce.service.AdminAuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

@RestController
@RequestMapping("/api/admin/audit-logs")
@RequiredArgsConstructor
public class AdminAuditLogController {

    private final AdminAuditService adminAuditService;

    @GetMapping
    public ResponseEntity<List<AdminAuditLogDto>> search(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) AdminActionType actionType,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) String productRef,
            @RequestParam(required = false) String search
    ) {
        Instant fromInstant = from.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant toInstant = to.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant().minusMillis(1);
        return ResponseEntity.ok(adminAuditService.search(
                fromInstant, toInstant, actionType, entityType, productRef, search));
    }

    @GetMapping("/stats")
    public ResponseEntity<AdminAuditStatsDto> stats(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        Instant fromInstant = from.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant toInstant = to.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant().minusMillis(1);
        return ResponseEntity.ok(adminAuditService.stats(fromInstant, toInstant));
    }
}
