package com.luxart.ecommerce.service.impl;

import com.luxart.ecommerce.dto.AnalyticsPeriod;
import com.luxart.ecommerce.dto.ProductStatsDto;
import com.luxart.ecommerce.exception.ResourceNotFoundException;
import com.luxart.ecommerce.model.entity.Product;
import com.luxart.ecommerce.model.enums.ProductEventType;
import com.luxart.ecommerce.model.enums.ProductStatut;
import com.luxart.ecommerce.repository.OrderItemRepository;
import com.luxart.ecommerce.repository.ProductEventRepository;
import com.luxart.ecommerce.repository.ProductLikeRepository;
import com.luxart.ecommerce.repository.ProductRepository;
import com.luxart.ecommerce.repository.ReviewRepository;
import com.luxart.ecommerce.service.ProductCommentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductAnalyticsServiceImplTest {

    @Mock private ProductRepository productRepository;
    @Mock private OrderItemRepository orderItemRepository;
    @Mock private ProductLikeRepository productLikeRepository;
    @Mock private ReviewRepository reviewRepository;
    @Mock private ProductCommentService productCommentService;
    @Mock private ProductEventRepository productEventRepository;

    @InjectMocks
    private ProductAnalyticsServiceImpl service;

    private Product product;
    private AnalyticsPeriod period;

    @BeforeEach
    void setUp() {
        product = Product.builder()
                .id(1L)
                .nom("Tableau Or")
                .prix(BigDecimal.valueOf(100))
                .stock(5)
                .statut(ProductStatut.DISPONIBLE)
                .build();
        period = AnalyticsPeriod.of(LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 31));
    }

    @Test
    void conversionRate_isSalesDividedByViews() {
        assertThat(ProductAnalyticsServiceImpl.conversionRate(5, 100)).isEqualTo(0.05);
        assertThat(ProductAnalyticsServiceImpl.conversionRate(0, 100)).isEqualTo(0.0);
        assertThat(ProductAnalyticsServiceImpl.conversionRate(10, 0)).isEqualTo(0.0);
    }

    @Test
    void getStatsForProduct_aggregatesViewsClicksSalesAndConversion() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(productEventRepository.countByProductAndTypeAndPeriod(
                eq(1L), eq(ProductEventType.VIEW), any(), any())).thenReturn(100L);
        when(productEventRepository.countByProductAndTypeAndPeriod(
                eq(1L), eq(ProductEventType.CLICK), any(), any())).thenReturn(20L);
        when(orderItemRepository.findSalesAndRevenueForProduct(eq(1L), any(), any()))
                .thenReturn(List.<Object[]>of(new Object[]{5L, BigDecimal.valueOf(500)}));

        ProductStatsDto stats = service.getStatsForProduct(1L, period);

        assertThat(stats.getProductId()).isEqualTo(1L);
        assertThat(stats.getProductName()).isEqualTo("Tableau Or");
        assertThat(stats.getTotalViews()).isEqualTo(100);
        assertThat(stats.getTotalClicks()).isEqualTo(20);
        assertThat(stats.getTotalSales()).isEqualTo(5);
        assertThat(stats.getRevenue()).isEqualByComparingTo("500");
        assertThat(stats.getConversionRate()).isEqualTo(0.05);
    }

    @Test
    void getStatsForProduct_throwsWhenProductMissing() {
        when(productRepository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getStatsForProduct(99L, period))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void trackEvent_dedupesViewsWithin30Minutes() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(productEventRepository.existsByProductIdAndSessionIdAndEventTypeAndCreatedAtAfter(
                eq(1L), eq("sess-1"), eq(ProductEventType.VIEW), any(Instant.class)))
                .thenReturn(true);

        service.trackEvent(1L, ProductEventType.VIEW, "sess-1", null);

        verify(productEventRepository, never()).save(any());
    }

    @Test
    void trackEvent_savesClickWithoutDedup() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        service.trackEvent(1L, ProductEventType.CLICK, "sess-1", 42L);

        ArgumentCaptor<com.luxart.ecommerce.model.entity.ProductEvent> captor =
                ArgumentCaptor.forClass(com.luxart.ecommerce.model.entity.ProductEvent.class);
        verify(productEventRepository).save(captor.capture());
        assertThat(captor.getValue().getEventType()).isEqualTo(ProductEventType.CLICK);
        assertThat(captor.getValue().getSessionId()).isEqualTo("sess-1");
        assertThat(captor.getValue().getUserId()).isEqualTo(42L);
    }
}
