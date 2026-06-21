package com.luxart.ecommerce.model.entity;

import com.luxart.ecommerce.model.enums.LoyaltyRewardType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "loyalty_programs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoyaltyProgram {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @Column(length = 1000)
    private String description;

    /** Nombre de commandes livrées pour déclencher la récompense */
    @Column(nullable = false)
    private Integer commandesRequises;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LoyaltyRewardType typeRecompense;

    /** 1 = un tableau gratuit, 50 = 50 DH de réduction */
    @Column(nullable = false)
    private BigDecimal valeurRecompense;

    @Column(nullable = false)
    @Builder.Default
    private Boolean actif = false;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
