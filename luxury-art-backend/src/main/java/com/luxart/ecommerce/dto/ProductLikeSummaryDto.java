package com.luxart.ecommerce.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductLikeSummaryDto {

    private long count;
    private boolean userLiked;
}
