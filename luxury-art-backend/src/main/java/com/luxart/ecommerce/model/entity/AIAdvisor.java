package com.luxart.ecommerce.model.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "ai_advisors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AIAdvisor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String modelName;

    @Column(length = 5000)
    private String context;

    @Column(length = 10000)
    private String historique;
}
