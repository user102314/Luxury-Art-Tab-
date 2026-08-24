package com.luxart.ecommerce.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.luxart.ecommerce.model.enums.AdminActionType;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class AdminAuditLogDto {
    private Long id;
    private AdminActionType actionType;
    private String entityType;
    private Long entityId;
    private String productRef;
    private String categoryName;
    private String imageUrl;
    private String imageStoragePath;
    private String requestPath;
    private String httpMethod;
    private Integer httpStatus;
    private Boolean success;
    private String requestPayload;
    private String responsePayload;
    private String errorMessage;
    private String adminEmail;
    private String adminName;
    private String clientIp;
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private Instant createdAt;
}
