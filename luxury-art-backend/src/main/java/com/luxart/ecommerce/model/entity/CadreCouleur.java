package com.luxart.ecommerce.model.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "cadre_couleurs",
        uniqueConstraints = @UniqueConstraint(columnNames = {"cadre_id", "nom"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CadreCouleur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cadre_id", nullable = false)
    private Cadre cadre;

    @Column(nullable = false, length = 80)
    private String nom;

    /** Code hex optionnel pour l'affichage boutique */
    @Column(length = 16)
    private String hex;

    @Column(nullable = false)
    @Builder.Default
    private Integer ordre = 0;
}
