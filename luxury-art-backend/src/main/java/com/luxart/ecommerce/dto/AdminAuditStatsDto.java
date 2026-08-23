package com.luxart.ecommerce.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class AdminAuditStatsDto {
    private long totalLogs;
    private long failureCount;
    private Map<String, Long> byActionType;
    private List<DuplicateRefAlertDto> duplicateCreates;
    private List<DuplicateRefAlertDto> duplicateUploads;
    private List<ProductActivityDto> topProductActivity;
}
