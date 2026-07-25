package com.luxart.ecommerce.dto;

import com.luxart.ecommerce.model.enums.TestimonialPlateforme;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestimonialDto {
    private Long id;

    @NotBlank
    private String clientNom;

    private String message;

    @NotNull
    private TestimonialPlateforme plateforme;

    private String imageUrl;
    private String avatarUrl;
    private String reponseBoutique;
    private Boolean actif;
    private Integer ordre;
    private LocalDateTime createdAt;
}
