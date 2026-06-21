package com.luxart.ecommerce.dto;

import com.luxart.ecommerce.model.enums.CommentStatut;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductCommentDto {

    private Long id;

    @NotNull
    private Long userId;

    private String userNom;

    @NotNull
    private Long productId;

    @NotBlank
    private String contenu;

    private LocalDateTime createdAt;

    private CommentStatut statut;
}
