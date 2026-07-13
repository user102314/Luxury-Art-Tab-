package com.luxart.ecommerce.service.impl;

import com.luxart.ecommerce.dto.AnalyticsPeriod;
import com.luxart.ecommerce.dto.DashboardSummaryDto;
import com.luxart.ecommerce.dto.ProductStatsDto;
import com.luxart.ecommerce.dto.TimeSeriesPointDto;
import com.luxart.ecommerce.model.entity.Order;
import com.luxart.ecommerce.model.entity.Product;
import com.luxart.ecommerce.model.enums.ProductEventType;
import com.luxart.ecommerce.model.enums.ProductStatut;
import com.luxart.ecommerce.model.enums.SalesGranularity;
import com.luxart.ecommerce.model.enums.TopProductCriteria;
import com.luxart.ecommerce.repository.OrderItemRepository;
import com.luxart.ecommerce.repository.OrderRepository;
import com.luxart.ecommerce.repository.ProductEventRepository;
import com.luxart.ecommerce.repository.ProductRepository;
import com.luxart.ecommerce.service.DashboardService;
import com.luxart.ecommerce.service.ProductAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardServiceImpl implements DashboardService {

    private static final int DEFAULT_TOP_LIMIT = 5;

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final ProductEventRepository productEventRepository;
    private final ProductAnalyticsService productAnalyticsService;

    @Override
    public DashboardSummaryDto getDashboardSummary(AnalyticsPeriod period) {
        BigDecimal totalRevenue = Optional.ofNullable(
                        orderRepository.sumRevenueLivreeInPeriod(period.fromDateTime(), period.toExclusiveDateTime()))
                .orElse(BigDecimal.ZERO);
        long totalOrders = orderRepository.countActiveInPeriod(period.fromDateTime(), period.toExclusiveDateTime());
        long totalActiveProducts = productRepository.findAll().stream()
                .filter(p -> p.getStatut() != ProductStatut.ARCHIVE)
                .count();

        BigDecimal averageOrderValue = totalOrders > 0
                ? totalRevenue.divide(BigDecimal.valueOf(totalOrders), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        long totalViews = productEventRepository.countByTypeAndPeriod(
                ProductEventType.VIEW, period.fromInstant(), period.toExclusiveInstant());
        // Taux global = commandes / vues produit (funnel boutique)
        double conversionRate = ProductAnalyticsServiceImpl.conversionRate(totalOrders, totalViews);

        List<ProductStatsDto> topBySales = getTopProducts(TopProductCriteria.SALES, DEFAULT_TOP_LIMIT, period);
        List<ProductStatsDto> topByViews = getTopProducts(TopProductCriteria.VIEWS, DEFAULT_TOP_LIMIT, period);

        return DashboardSummaryDto.builder()
                .totalRevenue(totalRevenue)
                .totalOrders(totalOrders)
                .totalActiveProducts(totalActiveProducts)
                .averageOrderValue(averageOrderValue)
                .conversionRate(conversionRate)
                .topProductsBySales(topBySales)
                .topProductsByViews(topByViews)
                .build();
    }

    @Override
    public List<TimeSeriesPointDto> getSalesOverTime(AnalyticsPeriod period, SalesGranularity granularity) {
        SalesGranularity grain = granularity != null ? granularity : SalesGranularity.DAY;
        List<Order> orders = orderRepository.findLivreeInPeriod(period.fromDateTime(), period.toExclusiveDateTime());

        Map<LocalDate, BigDecimal> buckets = new TreeMap<>();
        for (Order order : orders) {
            LocalDate bucket = bucketDate(order.getDateCommande().toLocalDate(), grain);
            BigDecimal amount = order.getTotal() != null ? order.getTotal() : BigDecimal.ZERO;
            buckets.merge(bucket, amount, BigDecimal::add);
        }

        fillEmptyBuckets(buckets, period.from(), period.to(), grain);

        return buckets.entrySet().stream()
                .map(e -> TimeSeriesPointDto.builder().date(e.getKey()).value(e.getValue()).build())
                .toList();
    }

    @Override
    public List<ProductStatsDto> getTopProducts(TopProductCriteria criteria, int limit, AnalyticsPeriod period) {
        int safeLimit = limit > 0 ? Math.min(limit, 50) : DEFAULT_TOP_LIMIT;
        TopProductCriteria crit = criteria != null ? criteria : TopProductCriteria.SALES;

        return switch (crit) {
            case SALES -> buildFromSalesRanking(safeLimit, period);
            case VIEWS -> buildFromEventRanking(ProductEventType.VIEW, safeLimit, period);
            case CLICKS -> buildFromEventRanking(ProductEventType.CLICK, safeLimit, period);
            case ADD_TO_CART -> buildFromEventRanking(ProductEventType.ADD_TO_CART, safeLimit, period);
        };
    }

    @Override
    public List<ProductStatsDto> getAllProductStats(AnalyticsPeriod period) {
        return productRepository.findAll().stream()
                .filter(p -> p.getStatut() != ProductStatut.ARCHIVE)
                .map(p -> productAnalyticsService.getStatsForProduct(p.getId(), period))
                .sorted(Comparator.comparing(ProductStatsDto::getTotalSales).reversed())
                .toList();
    }

    private List<ProductStatsDto> buildFromSalesRanking(int limit, AnalyticsPeriod period) {
        List<Object[]> rows = orderItemRepository.findTopProductsBySales(
                period.fromDateTime(), period.toExclusiveDateTime(), PageRequest.of(0, limit));

        List<ProductStatsDto> result = new ArrayList<>();
        for (Object[] row : rows) {
            Long productId = ((Number) row[0]).longValue();
            result.add(productAnalyticsService.getStatsForProduct(productId, period));
        }
        return result;
    }

    private List<ProductStatsDto> buildFromEventRanking(
            ProductEventType eventType, int limit, AnalyticsPeriod period) {
        List<Object[]> rows = productEventRepository.findTopProductIdsByEventType(
                eventType, period.fromInstant(), period.toExclusiveInstant(), PageRequest.of(0, limit));

        List<ProductStatsDto> result = new ArrayList<>();
        for (Object[] row : rows) {
            Long productId = ((Number) row[0]).longValue();
            result.add(productAnalyticsService.getStatsForProduct(productId, period));
        }

        // Si aucun event, compléter avec des produits du catalogue (stats à zéro) pour l'UI
        if (result.isEmpty()) {
            result = productRepository.findAll().stream()
                    .limit(limit)
                    .map(p -> emptyStats(p))
                    .collect(Collectors.toList());
        }
        return result;
    }

    private ProductStatsDto emptyStats(Product product) {
        return ProductStatsDto.builder()
                .productId(product.getId())
                .productName(product.getNom())
                .totalViews(0)
                .totalClicks(0)
                .totalAddToCart(0)
                .totalSales(0)
                .revenue(BigDecimal.ZERO)
                .conversionRate(0)
                .build();
    }

    private static LocalDate bucketDate(LocalDate date, SalesGranularity granularity) {
        return switch (granularity) {
            case DAY -> date;
            case WEEK -> date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            case MONTH -> date.withDayOfMonth(1);
        };
    }

    private static void fillEmptyBuckets(
            Map<LocalDate, BigDecimal> buckets, LocalDate from, LocalDate to, SalesGranularity grain) {
        LocalDate cursor = bucketDate(from, grain);
        LocalDate end = bucketDate(to, grain);
        while (!cursor.isAfter(end)) {
            buckets.putIfAbsent(cursor, BigDecimal.ZERO);
            cursor = switch (grain) {
                case DAY -> cursor.plusDays(1);
                case WEEK -> cursor.plusWeeks(1);
                case MONTH -> cursor.plusMonths(1);
            };
        }
    }
}
