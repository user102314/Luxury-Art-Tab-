package com.luxart.ecommerce.service;

import com.luxart.ecommerce.dto.AnalyticsPeriod;
import com.luxart.ecommerce.dto.DashboardSummaryDto;
import com.luxart.ecommerce.dto.ProductStatsDto;
import com.luxart.ecommerce.dto.TimeSeriesPointDto;
import com.luxart.ecommerce.model.enums.SalesGranularity;
import com.luxart.ecommerce.model.enums.TopProductCriteria;

import java.util.List;

public interface DashboardService {

    DashboardSummaryDto getDashboardSummary(AnalyticsPeriod period);

    List<TimeSeriesPointDto> getSalesOverTime(AnalyticsPeriod period, SalesGranularity granularity);

    List<ProductStatsDto> getTopProducts(TopProductCriteria criteria, int limit, AnalyticsPeriod period);

    List<ProductStatsDto> getAllProductStats(AnalyticsPeriod period);
}
