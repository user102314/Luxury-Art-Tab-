package com.luxart.ecommerce.dto;

import com.luxart.ecommerce.model.enums.ProductEventType;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductTrackRequest {

    private String sessionId;
    private Long userId;
    private ProductEventType eventType;
}
