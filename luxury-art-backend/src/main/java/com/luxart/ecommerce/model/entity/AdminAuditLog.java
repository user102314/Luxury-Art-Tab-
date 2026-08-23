package com.luxart.ecommerce.model.entity;

import com.luxart.ecommerce.model.enums.AdminActionType;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(
        name = "admin_audit_logs",
        indexes = {
                @Index(name = "idx_audit_created_at", columnList = "created_at"),
                @Index(name = "idx_audit_action_type", columnList = "action_type"),
                @Index(name = "idx_audit_product_ref", columnList = "product_ref"),
                @Index(name = "idx_audit_entity", columnList = "entity_type, entity_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false, length = 48)
    private AdminActionType actionType;

    @Column(name = "entity_type", nullable = false, length = 32)
    private String entityType;

    private Long entityId;

    @Column(name = "product_ref", length = 64)
    private String productRef;

    @Column(name = "category_name", length = 128)
    private String categoryName;

    @Column(name = "image_url", length = 512)
    private String imageUrl;

    @Column(name = "image_storage_path", length = 512)
    private String imageStoragePath;

    @Column(name = "request_path", length = 256)
    private String requestPath;

    @Column(name = "http_method", length = 8)
    private String httpMethod;

    @Column(name = "http_status")
    private Integer httpStatus;

    @Column(nullable = false)
    private Boolean success;

    @Column(name = "request_payload", columnDefinition = "TEXT")
    private String requestPayload;

    @Column(name = "response_payload", columnDefinition = "TEXT")
    private String responsePayload;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "admin_email", length = 128)
    private String adminEmail;

    @Column(name = "admin_name", length = 128)
    private String adminName;

    @Column(name = "client_ip", length = 64)
    private String clientIp;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (success == null) {
            success = true;
        }
    }
}
