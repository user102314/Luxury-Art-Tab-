package com.luxart.ecommerce.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "site_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SiteSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    @Builder.Default
    private Integer termsVersion = 1;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String termsContent;

    @Column(nullable = false)
    @Builder.Default
    private String whatsappNumber = "212600000000";

    @Column(nullable = false, columnDefinition = "TEXT")
    private String supportFaqJson;

    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void touch() {
        updatedAt = LocalDateTime.now();
    }
}
