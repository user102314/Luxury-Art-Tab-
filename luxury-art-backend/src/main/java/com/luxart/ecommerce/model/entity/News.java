package com.luxart.ecommerce.model.entity;

import com.luxart.ecommerce.model.enums.NewsStatut;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "news")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class News {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    @Column(length = 500)
    private String resume;

    @Column(nullable = false, length = 10000)
    private String contenu;

    private String imageUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auteur_id", nullable = false)
    private User auteur;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NewsStatut statut;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime publishedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (statut == null) {
            statut = NewsStatut.BROUILLON;
        }
    }

    public void publier() {
        this.statut = NewsStatut.PUBLIE;
        this.publishedAt = LocalDateTime.now();
    }
}
