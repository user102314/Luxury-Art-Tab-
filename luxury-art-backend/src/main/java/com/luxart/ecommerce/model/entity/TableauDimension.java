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

    /** Ex. 90/60 */
    @Column(nullable = false, unique = true, length = 30)
    private String label;

    @Column(nullable = false)
    private Integer largeur;

    @Column(nullable = false)
    private Integer hauteur;

    @Column(nullable = false)
    @Builder.Default
    private Integer ordre = 0;

    /** Note optionnelle (ex. « 3 » = tableau 3 pièces). Affichée côté boutique : note × dimension. */
    @Column(length = 40)
    private String note;
}
