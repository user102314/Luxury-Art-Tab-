package com.luxart.ecommerce.service.impl;

import com.luxart.ecommerce.dto.AnalyticsPeriod;
import com.luxart.ecommerce.dto.DashboardSummaryDto;
import com.luxart.ecommerce.dto.ProductStatsDto;
import com.luxart.ecommerce.dto.TimeSeriesPointDto;
import com.luxart.ecommerce.model.entity.Order;
import com.luxart.ecommerce.model.entity.Product;
import com.luxart.ecommerce.model.enums.OrderStatut;
import com.luxart.ecommerce.model.enums.ProductEventType;
import com.luxart.ecommerce.model.enums.ProductStatut;
import com.luxart.ecommerce.model.enums.SalesGranularity;
import com.luxart.ecommerce.model.enums.TopProductCriteria;
import com.luxart.ecommerce.repository.OrderItemRepository;
import com.luxart.ecommerce.repository.OrderRepository;
import com.luxart.ecommerce.repository.ProductEventRepository;
import com.luxart.ecommerce.repository.ProductRepository;
import com.luxart.ecommerce.service.ProductAnalyticsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceImplTest {

    @Mock private OrderRepository orderRepository;
    @Mock private OrderItemRepository orderItemRepository;
    @Mock private ProductRepository productRepository;
    @Mock private ProductEventRepository productEventRepository;
    @Mock private ProductAnalyticsService productAnalyticsService;

    @InjectMocks
    private DashboardServiceImpl dashboardService;

    private AnalyticsPeriod period;

    @BeforeEach
    void setUp() {
        period = AnalyticsPeriod.of(LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 10));
    }

    @Test
    void getDashboardSummary_computesKpisAndGlobalConversion() {
        Product active = Product.builder().id(1L).nom("A").prix(BigDecimal.TEN).stock(1)
                .statut(ProductStatut.DISPONIBLE).build();
        Product archived = Product.builder().id(2L).nom("B").prix(BigDecimal.TEN).stock(1)
                .statut(ProductStatut.ARCHIVE).build();

        when(orderRepository.sumRevenueLivreeInPeriod(any(), any())).thenReturn(BigDecimal.valueOf(1000));
        when(orderRepository.countActiveInPeriod(any(), any())).thenReturn(10L);
        when(productRepository.findAll()).thenReturn(List.of(active, archived));
        when(productEventRepository.countByTypeAndPeriod(eq(ProductEventType.VIEW), any(), any()))
                .thenReturn(200L);
        when(orderItemRepository.findTopProductsBySales(any(), any(), any(Pageable.class)))
                .thenReturn(List.of());
        when(productEventRepository.findTopProductIdsByEventType(
                eq(ProductEventType.VIEW), any(), any(), any(Pageable.class)))
                .thenReturn(List.of());
        when(productRepository.findAll()).thenReturn(List.of(active, archived));

        DashboardSummaryDto summary = dashboardService.getDashboardSummary(period);

        assertThat(summary.getTotalRevenue()).isEqualByComparingTo("1000");
        assertThat(summary.getTotalOrders()).isEqualTo(10);
        assertThat(summary.getTotalActiveProducts()).isEqualTo(1);
        assertThat(summary.getAverageOrderValue()).isEqualByComparingTo("100.00");
        // 10 commandes / 200 vues = 0.05
        assertThat(summary.getConversionRate()).isEqualTo(0.05);
    }

    @Test
    void getSalesOverTime_groupsByDay() {
        Order o1 = Order.builder()
                .dateCommande(LocalDateTime.of(2026, 7, 2, 10, 0))
                .statut(OrderStatut.LIVREE)
                .total(BigDecimal.valueOf(100))
                .adresseLivraison("x")
                .build();
        Order o2 = Order.builder()
                .dateCommande(LocalDateTime.of(2026, 7, 2, 18, 0))
                .statut(OrderStatut.LIVREE)
                .total(BigDecimal.valueOf(50))
                .adresseLivraison("x")
                .build();
        when(orderRepository.findLivreeInPeriod(any(), any())).thenReturn(List.of(o1, o2));

        List<TimeSeriesPointDto> points = dashboardService.getSalesOverTime(period, SalesGranularity.DAY);

        assertThat(points).isNotEmpty();
        TimeSeriesPointDto july2 = points.stream()
                .filter(p -> p.getDate().equals(LocalDate.of(2026, 7, 2)))
                .findFirst()
                .orElseThrow();
        assertThat(july2.getValue()).isEqualByComparingTo("150");
    }

    @Test
    void getTopProducts_bySales_usesStatsService() {
        when(orderItemRepository.findTopProductsBySales(any(), any(), any(Pageable.class)))
                .thenReturn(List.<Object[]>of(new Object[]{1L, "Tableau", 5L, BigDecimal.valueOf(500)}));
        when(productAnalyticsService.getStatsForProduct(eq(1L), eq(period)))
                .thenReturn(ProductStatsDto.builder()
                        .productId(1L)
                        .productName("Tableau")
                        .totalViews(100)
                        .totalClicks(10)
                        .totalSales(5)
                        .revenue(BigDecimal.valueOf(500))
                        .conversionRate(0.05)
                        .build());

        List<ProductStatsDto> top = dashboardService.getTopProducts(TopProductCriteria.SALES, 5, period);

        assertThat(top).hasSize(1);
        assertThat(top.get(0).getConversionRate()).isEqualTo(0.05);
        assertThat(top.get(0).getTotalSales()).isEqualTo(5);
    }
}
