package com.luxart.ecommerce.model.entity;

import com.luxart.ecommerce.model.enums.OrderCanal;
import com.luxart.ecommerce.model.enums.OrderStatut;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDateTime dateCommande;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatut statut;

    @Column(precision = 12, scale = 2)
    private BigDecimal total;

    @Column(nullable = false)
    private String adresseLivraison;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private OrderCanal canal = OrderCanal.SITE_WEB;

    /** Nom affiché du client (surtout commandes Facebook) */
    private String clientNom;

    private String clientTelephone;

    /** Réf. conversation / publication Facebook */
    private String referenceFacebook;

    /** Réf. conversation / publication Instagram */
    private String referenceInstagram;

    /** Réf. conversation WhatsApp */
    private String referenceWhatsapp;

    /** Numéro de colis (généré à la confirmation) */
    private String numeroColis;

    /** Stock déjà déduit pour cette commande */
    @Builder.Default
    private Boolean stockDeduit = false;

    /** Évite de compter deux fois une commande pour la fidélité */
    @Builder.Default
    private Boolean fideliteComptabilisee = false;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        if (dateCommande == null) {
            dateCommande = LocalDateTime.now();
        }
    }

    public BigDecimal calcTotal() {
        return items.stream()
                .map(item -> item.getPrixUnitaire().multiply(BigDecimal.valueOf(item.getQuantite())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
