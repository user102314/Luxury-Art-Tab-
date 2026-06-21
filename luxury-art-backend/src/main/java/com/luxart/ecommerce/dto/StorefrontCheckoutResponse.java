package com.luxart.ecommerce.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StorefrontCheckoutResponse {

    private Long orderId;
    private Long userId;
    private BigDecimal total;
}
