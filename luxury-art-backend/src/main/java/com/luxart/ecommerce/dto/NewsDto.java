package com.luxart.ecommerce.dto;

import com.luxart.ecommerce.model.enums.NewsStatut;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NewsDto {

    private Long id;

    @NotBlank
    private String titre;

    private String resume;

    @NotBlank
    private String contenu;

    private String imageUrl;

    @NotNull
    private Long auteurId;

    private String auteurNom;

    private NewsStatut statut;

    private LocalDateTime createdAt;

    private LocalDateTime publishedAt;
}
