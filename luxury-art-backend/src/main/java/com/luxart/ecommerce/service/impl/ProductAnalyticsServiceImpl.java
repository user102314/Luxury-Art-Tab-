package com.luxart.ecommerce.service.impl;

import com.luxart.ecommerce.config.AsyncConfig;
import com.luxart.ecommerce.dto.*;
import com.luxart.ecommerce.exception.ResourceNotFoundException;
import com.luxart.ecommerce.model.entity.OrderItem;
import com.luxart.ecommerce.model.entity.Product;
import com.luxart.ecommerce.model.entity.ProductEvent;
import com.luxart.ecommerce.model.entity.ProductLike;
import com.luxart.ecommerce.model.entity.Review;
import com.luxart.ecommerce.model.enums.ProductEventType;
import com.luxart.ecommerce.repository.*;
import com.luxart.ecommerce.service.ProductAnalyticsService;
import com.luxart.ecommerce.service.ProductCommentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductAnalyticsServiceImpl implements ProductAnalyticsService {

    private static final long VIEW_DEDUPE_MINUTES = 30;

    private final ProductRepository productRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductLikeRepository productLikeRepository;
    private final ReviewRepository reviewRepository;
    private final ProductCommentService productCommentService;
    private final ProductEventRepository productEventRepository;

    @Override
    public List<ProductBestSellerDto> getBestSellers() {
        Map<Long, SalesAgg> sales = aggregateSales();

        return sales.entrySet().stream()
                .sorted(Comparator.comparing((Map.Entry<Long, SalesAgg> e) -> e.getValue().quantite()).reversed())
                .map(e -> {
                    Product p = productRepository.findById(e.getKey()).orElse(null);
                    return ProductBestSellerDto.builder()
                            .productId(e.getKey())
                            .nom(p != null ? p.getNom() : "Produit #" + e.getKey())
                            .quantiteVendue(e.getValue().quantite())
                            .chiffreAffaires(e.getValue().ca())
                            .build();
                })
                .toList();
    }

    @Override
    public ProductAnalyticsDto getAnalytics(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable: " + productId));

        List<ProductLike> likes = productLikeRepository.findByProductIdOrderByCreatedAtDesc(productId);
        List<ProductCommentDto> comments = productCommentService.findByProductId(productId);
        List<Review> reviews = reviewRepository.findByProductId(productId);

        SalesAgg sales = aggregateSales().getOrDefault(productId, new SalesAgg(0L, BigDecimal.ZERO));

        double avgNote = reviews.stream().mapToInt(Review::getNote).average().orElse(0);

        List<ProductLikeDto> likeDtos = likes.stream().map(l -> ProductLikeDto.builder()
                .id(l.getId())
                .userId(l.getUser().getId())
                .userNom(l.getUser().getNom())
                .productId(productId)
                .createdAt(l.getCreatedAt())
                .build()).toList();

        return ProductAnalyticsDto.builder()
                .productId(productId)
                .nom(product.getNom())
                .nombreJaimes(likes.size())
                .nombreCommentaires(comments.size())
                .nombreAvis(reviews.size())
                .noteMoyenne(Math.round(avgNote * 10) / 10.0)
                .quantiteVendue(sales.quantite())
                .chiffreAffaires(sales.ca())
                .jaimes(likeDtos)
                .commentaires(comments)
                .build();
    }

    @Override
    @Async(AsyncConfig.ANALYTICS_EXECUTOR)
    @Transactional
    public void trackEvent(Long productId, ProductEventType eventType, String sessionId, Long userId) {
        try {
            if (productId == null || eventType == null || sessionId == null || sessionId.isBlank()) {
                return;
            }

            Product product = productRepository.findById(productId).orElse(null);
            if (product == null) {
                log.debug("trackEvent ignored: product {} not found", productId);
                return;
            }

            if (eventType == ProductEventType.VIEW) {
                Instant threshold = Instant.now().minus(VIEW_DEDUPE_MINUTES, ChronoUnit.MINUTES);
                boolean recentView = productEventRepository
                        .existsByProductIdAndSessionIdAndEventTypeAndCreatedAtAfter(
                                productId, sessionId, ProductEventType.VIEW, threshold);
                if (recentView) {
                    return;
                }
            }

            ProductEvent event = ProductEvent.builder()
                    .product(product)
                    .eventType(eventType)
                    .sessionId(sessionId.trim())
                    .userId(userId)
                    .createdAt(Instant.now())
                    .build();
            productEventRepository.save(event);
        } catch (Exception ex) {
            log.warn("Failed to track product event {} for product {}: {}", eventType, productId, ex.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public ProductStatsDto getStatsForProduct(Long productId, AnalyticsPeriod period) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable: " + productId));

        long views = productEventRepository.countByProductAndTypeAndPeriod(
                productId, ProductEventType.VIEW, period.fromInstant(), period.toExclusiveInstant());
        long clicks = productEventRepository.countByProductAndTypeAndPeriod(
                productId, ProductEventType.CLICK, period.fromInstant(), period.toExclusiveInstant());
        long addToCart = productEventRepository.countByProductAndTypeAndPeriod(
                productId, ProductEventType.ADD_TO_CART, period.fromInstant(), period.toExclusiveInstant());

        long totalSales = 0L;
        BigDecimal revenue = BigDecimal.ZERO;
        List<Object[]> salesRows = orderItemRepository.findSalesAndRevenueForProduct(
                productId, period.fromDateTime(), period.toExclusiveDateTime());
        if (!salesRows.isEmpty() && salesRows.get(0) != null) {
            Object rowObj = salesRows.get(0);
            // Spring Data may return Object[] or a scalar-wrapped row
            if (rowObj instanceof Object[] row && row.length >= 2) {
                totalSales = toLong(row[0]);
                revenue = toBigDecimal(row[1]);
            }
        }

        return ProductStatsDto.builder()
                .productId(productId)
                .productName(product.getNom())
                .totalViews(views)
                .totalClicks(clicks)
                .totalAddToCart(addToCart)
                .totalSales(totalSales)
                .revenue(revenue)
                .conversionRate(conversionRate(totalSales, views))
                .build();
    }

    public static double conversionRate(long totalSales, long totalViews) {
        if (totalViews <= 0) {
            return 0.0;
        }
        return BigDecimal.valueOf(totalSales)
                .divide(BigDecimal.valueOf(totalViews), 4, RoundingMode.HALF_UP)
                .doubleValue();
    }

    private Map<Long, SalesAgg> aggregateSales() {
        List<OrderItem> items = orderItemRepository.findAll();
        Map<Long, SalesAgg> map = new HashMap<>();
        for (OrderItem item : items) {
            Long pid = item.getProduct().getId();
            long qty = item.getQuantite();
            BigDecimal line = item.getPrixUnitaire().multiply(BigDecimal.valueOf(qty));
            map.merge(pid, new SalesAgg(qty, line), (a, b) ->
                    new SalesAgg(a.quantite() + b.quantite(), a.ca().add(b.ca())));
        }
        return map;
    }

    private static long toLong(Object value) {
        if (value == null) return 0L;
        if (value instanceof Number n) return n.longValue();
        return Long.parseLong(value.toString());
    }

    private static BigDecimal toBigDecimal(Object value) {
        if (value == null) return BigDecimal.ZERO;
        if (value instanceof BigDecimal bd) return bd;
        if (value instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        return new BigDecimal(value.toString());
    }

    private record SalesAgg(long quantite, BigDecimal ca) {}
}
