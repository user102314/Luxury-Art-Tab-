package com.luxart.ecommerce.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProductActivityDto {
    private String productRef;
    private Long productId;
    private long uploadCount;
    private long updateCount;
    private long createCount;
}
