package com.luxart.ecommerce.service;

import com.luxart.ecommerce.dto.ProductLikeDto;
import com.luxart.ecommerce.dto.ProductLikeSummaryDto;

import java.util.List;

public interface ProductLikeService {

    ProductLikeSummaryDto getSummary(Long productId, Long userId);

    List<ProductLikeDto> findByProductId(Long productId);

    ProductLikeDto like(Long productId, Long userId);

    void unlike(Long productId, Long userId);
}
