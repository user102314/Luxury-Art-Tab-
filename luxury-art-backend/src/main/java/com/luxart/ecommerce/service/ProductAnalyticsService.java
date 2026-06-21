package com.luxart.ecommerce.service;

import com.luxart.ecommerce.dto.ProductAnalyticsDto;
import com.luxart.ecommerce.dto.ProductBestSellerDto;

import java.util.List;

public interface ProductAnalyticsService {
    List<ProductBestSellerDto> getBestSellers();
    ProductAnalyticsDto getAnalytics(Long productId);
}
