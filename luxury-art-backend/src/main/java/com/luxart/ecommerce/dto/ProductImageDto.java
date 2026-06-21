package com.luxart.ecommerce.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductImageDto {

    private Long id;
    private Long productId;
    private String url;
    private String storagePath;
    private Integer ordre;
    private LocalDateTime createdAt;
}
