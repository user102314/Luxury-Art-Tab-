package com.luxart.ecommerce.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminNotificationDto {
    private String type;
    private String title;
    private String message;
    private Long orderId;
    private String canal;
    private String clientNom;
    private java.math.BigDecimal total;
    private String createdAt;
}
