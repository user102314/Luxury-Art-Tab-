package com.luxart.ecommerce.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductLikeDto {

    private Long id;
    private Long userId;
    private String userNom;
    private Long productId;
    private LocalDateTime createdAt;
}
