package com.luxart.ecommerce.service;

import com.luxart.ecommerce.dto.AnalyticsPeriod;
import com.luxart.ecommerce.dto.ProductBestSellerDto;
import com.luxart.ecommerce.dto.ProductAnalyticsDto;
import com.luxart.ecommerce.dto.ProductStatsDto;
import com.luxart.ecommerce.model.enums.ProductEventType;

import java.util.List;

public interface ProductAnalyticsService {
    List<ProductBestSellerDto> getBestSellers();

    ProductAnalyticsDto getAnalytics(Long productId);

    void trackEvent(Long productId, ProductEventType eventType, String sessionId, Long userId);

    ProductStatsDto getStatsForProduct(Long productId, AnalyticsPeriod period);
}
