package com.luxart.ecommerce.model.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tableau_dimensions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TableauDimension {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Ex. 90/60 — plusieurs lignes possibles si la note diffère */
    @Column(nullable = false, length = 30)
    private String label;

    @Column(nullable = false)
    private Integer largeur;

    @Column(nullable = false)
    private Integer hauteur;

    @Column(nullable = false)
    @Builder.Default
    private Integer ordre = 0;

    /** Note optionnelle (ex. « 3 »). Chaîne vide = sans note. Unique avec label. */
    @Column(nullable = false, length = 40)
    @Builder.Default
    private String note = "";
}
