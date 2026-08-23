package com.luxart.ecommerce.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DuplicateRefAlertDto {
    private String productRef;
    private long count;
}
