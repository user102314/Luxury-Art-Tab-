package com.luxart.ecommerce.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "cadres")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cadre {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 80)
    private String nom;

    @Column(nullable = false, unique = true, length = 40)
    private String code;

    @Column(nullable = false)
    @Builder.Default
    private Integer ordre = 0;

    @OneToMany(mappedBy = "cadre", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<CadreCouleur> couleurs = new ArrayList<>();
}
