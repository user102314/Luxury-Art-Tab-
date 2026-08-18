package com.luxart.ecommerce.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(
        name = "dimension_cadre_prix",
        uniqueConstraints = @UniqueConstraint(columnNames = {"dimension_id", "cadre_id"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DimensionCadrePrix {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "dimension_id", nullable = false)
    private TableauDimension dimension;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cadre_id", nullable = false)
    private Cadre cadre;

    /** Null = combinaison pas encore tarifée / indisponible */
    @Column(precision = 10, scale = 2)
    private BigDecimal prix;
}
