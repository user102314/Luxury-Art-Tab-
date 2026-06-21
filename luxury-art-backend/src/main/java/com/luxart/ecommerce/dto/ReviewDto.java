package com.luxart.ecommerce.dto;

import com.luxart.ecommerce.model.enums.ReviewStatut;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewDto {

    private Long id;

    @NotNull
    private Long userId;

    @NotNull
    private Long productId;

    @NotNull
    @Min(1)
    @Max(5)
    private Integer note;

    private String commentaire;

    private LocalDateTime createdAt;

    private ReviewStatut statut;
}
