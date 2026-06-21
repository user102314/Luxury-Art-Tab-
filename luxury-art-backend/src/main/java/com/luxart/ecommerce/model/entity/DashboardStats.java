package com.luxart.ecommerce.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "dashboard_stats")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStats {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Embedded
    private DateRange periode;

    private Long totalCommandes;

    @Column(precision = 14, scale = 2)
    private BigDecimal chiffreAffaires;

    @Column(precision = 14, scale = 2)
    private BigDecimal profitBrut;

    @Column(precision = 14, scale = 2)
    private BigDecimal profitNet;

    @Column(length = 5000)
    private String topProduits;
}
