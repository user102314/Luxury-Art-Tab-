package com.luxart.ecommerce.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "client_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    private String telephone;

    /** Commandes livrées dans le cycle en cours */
    @Column(nullable = false)
    @Builder.Default
    private Integer commandesCycle = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer totalCommandesLivrees = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer totalRecompenses = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer tableauxGratuits = 0;

    @Column(nullable = false)
    @Builder.Default
    private BigDecimal reductionDisponible = BigDecimal.ZERO;

    private LocalDateTime termsAcceptedAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
