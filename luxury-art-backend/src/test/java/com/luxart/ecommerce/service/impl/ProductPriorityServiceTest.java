package com.luxart.ecommerce.service.impl;

import com.luxart.ecommerce.dto.ProductDto;
import com.luxart.ecommerce.model.entity.Category;
import com.luxart.ecommerce.model.entity.Product;
import com.luxart.ecommerce.model.enums.ProductStatut;
import com.luxart.ecommerce.repository.CategoryRepository;
import com.luxart.ecommerce.repository.ProductImageRepository;
import com.luxart.ecommerce.repository.ProductRepository;
import com.luxart.ecommerce.repository.TableauDimensionRepository;
import com.luxart.ecommerce.service.AdminAuditService;
import com.luxart.ecommerce.service.CatalogPricingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductPriorityServiceTest {

    @Mock ProductRepository productRepository;
    @Mock CategoryRepository categoryRepository;
    @Mock ProductImageRepository productImageRepository;
    @Mock TableauDimensionRepository dimensionRepository;
    @Mock CatalogPricingService catalogPricingService;
    @Mock AdminAuditService adminAuditService;

    @InjectMocks ProductServiceImpl productService;

    private Category category;
    private Product a;
    private Product b;
    private Product c;

    @BeforeEach
    void setUp() {
        category = Category.builder().id(10L).nom("FEMMES").build();
        a = Product.builder().id(1L).ref("B 1").categorie(category).statut(ProductStatut.DISPONIBLE).displayOrder(1).build();
        b = Product.builder().id(2L).ref("B 2").categorie(category).statut(ProductStatut.DISPONIBLE).displayOrder(2).build();
        c = Product.builder().id(3L).ref("B 3").categorie(category).statut(ProductStatut.DISPONIBLE).displayOrder(3).build();

        when(catalogPricingService.minPriceByDimension()).thenReturn(Map.of());
        when(productImageRepository.findByProductIdOrderByOrdreAsc(any())).thenReturn(List.of());
    }

    @Test
    void promoteToFirstMovesProductAheadOfOthers() {
        when(productRepository.findById(3L)).thenReturn(Optional.of(c));
        when(productRepository.findByCategorieId(10L)).thenReturn(new ArrayList<>(List.of(a, b, c)));

        ProductDto result = productService.promote(3L, true);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Product>> captor = ArgumentCaptor.forClass(List.class);
        verify(productRepository).saveAll(captor.capture());
        List<Product> saved = captor.getValue();

        assertThat(saved.get(0).getId()).isEqualTo(3L);
        assertThat(saved.get(0).getDisplayOrder()).isEqualTo(1);
        assertThat(saved.get(1).getId()).isEqualTo(1L);
        assertThat(saved.get(1).getDisplayOrder()).isEqualTo(2);
        assertThat(saved.get(2).getId()).isEqualTo(2L);
        assertThat(saved.get(2).getDisplayOrder()).isEqualTo(3);
        assertThat(result.getDisplayOrder()).isEqualTo(1);
    }

    @Test
    void promoteUpMovesOneSlot() {
        when(productRepository.findById(3L)).thenReturn(Optional.of(c));
        when(productRepository.findByCategorieId(10L)).thenReturn(new ArrayList<>(List.of(a, b, c)));

        productService.promote(3L, false);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Product>> captor = ArgumentCaptor.forClass(List.class);
        verify(productRepository).saveAll(captor.capture());
        List<Product> saved = captor.getValue();

        assertThat(saved.get(0).getId()).isEqualTo(1L);
        assertThat(saved.get(1).getId()).isEqualTo(3L);
        assertThat(saved.get(1).getDisplayOrder()).isEqualTo(2);
        assertThat(saved.get(2).getId()).isEqualTo(2L);
    }

    @Test
    void setAsCategoryHeroUpdatesCategoryHeroProductId() {
        when(productRepository.findById(3L)).thenReturn(Optional.of(c));
        when(categoryRepository.save(any(Category.class))).thenAnswer(inv -> inv.getArgument(0));
        when(productImageRepository.findByProductIdOrderByOrdreAsc(3L)).thenReturn(List.of());

        ProductDto result = productService.setAsCategoryHero(3L);

        ArgumentCaptor<Category> captor = ArgumentCaptor.forClass(Category.class);
        verify(categoryRepository).save(captor.capture());
        assertThat(captor.getValue().getHeroProductId()).isEqualTo(3L);
        assertThat(result.getId()).isEqualTo(3L);
    }
}
