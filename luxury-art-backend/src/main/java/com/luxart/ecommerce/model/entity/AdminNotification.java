package com.luxart.ecommerce.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "admin_notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 2000)
    private String message;

    private Long orderId;

    private String canal;

    private String clientNom;

    @Column(precision = 12, scale = 2)
    private BigDecimal total;

    private String clientTelephone;

    private String colissimoCodeBarre;

    private String colissimoEtat;

    private String statut;

    @Column(length = 500)
    private String adresseLivraison;

    @Column(length = 500)
    private String colissimoDesignation;

    private String reference;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Builder.Default
    private Boolean read = false;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (read == null) {
            read = false;
        }
    }
}
