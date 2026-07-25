package com.luxart.ecommerce.model.entity;

import com.luxart.ecommerce.model.enums.TestimonialPlateforme;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "testimonials")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Testimonial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String clientNom;

    @Column(length = 2000)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TestimonialPlateforme plateforme;

    /** Capture d'écran ou photo client (preuve sociale). */
    private String imageUrl;

    private String avatarUrl;

    @Column(length = 1000)
    private String reponseBoutique;

    @Column(nullable = false)
    @Builder.Default
    private Boolean actif = true;

    @Column(nullable = false)
    @Builder.Default
    private Integer ordre = 0;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (actif == null) actif = true;
        if (ordre == null) ordre = 0;
        if (plateforme == null) plateforme = TestimonialPlateforme.AUTRE;
    }
}
