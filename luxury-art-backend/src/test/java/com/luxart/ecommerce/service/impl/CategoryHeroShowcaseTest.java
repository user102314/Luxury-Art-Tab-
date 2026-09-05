package com.luxart.ecommerce.service.impl;

import com.luxart.ecommerce.dto.CategoryShowcaseDto;
import com.luxart.ecommerce.dto.ProductDto;
import com.luxart.ecommerce.model.entity.Category;
import com.luxart.ecommerce.model.entity.Product;
import com.luxart.ecommerce.model.enums.ProductStatut;
import com.luxart.ecommerce.repository.CategoryRepository;
import com.luxart.ecommerce.repository.ProductImageRepository;
import com.luxart.ecommerce.repository.ProductRepository;
import com.luxart.ecommerce.service.AdminAuditService;
import com.luxart.ecommerce.service.ProductService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CategoryHeroShowcaseTest {

    @Mock CategoryRepository categoryRepository;
    @Mock ProductRepository productRepository;
    @Mock ProductImageRepository productImageRepository;
    @Mock ProductService productService;
    @Mock AdminAuditService adminAuditService;

    @InjectMocks CategoryServiceImpl categoryService;

    private Category category;
    private Product first;
    private Product hero;

    @BeforeEach
    void setUp() {
        category = Category.builder().id(10L).nom("FEMMES").build();
        first = Product.builder().id(1L).ref("B 1").categorie(category).statut(ProductStatut.DISPONIBLE).displayOrder(1).build();
        hero = Product.builder().id(99L).ref("B 99").categorie(category).statut(ProductStatut.DISPONIBLE).displayOrder(5).build();
    }

    @Test
    void showcaseUsesExplicitHeroProductEvenIfNotFirst() {
        category.setHeroProductId(99L);
        when(categoryRepository.findAll()).thenReturn(List.of(category));
        when(productRepository.findByCategorieId(10L)).thenReturn(List.of(first, hero));
        ProductDto heroDto = ProductDto.builder().id(99L).ref("B 99").categoryId(10L).build();
        when(productService.findById(99L)).thenReturn(heroDto);

        List<CategoryShowcaseDto> slides = categoryService.findShowcase();

        assertThat(slides).hasSize(1);
        assertThat(slides.get(0).getProduct().getId()).isEqualTo(99L);
        verify(productService).findById(99L);
    }

    @Test
    void showcaseFallsBackWhenHeroMissingFromAvailable() {
        category.setHeroProductId(404L);
        when(categoryRepository.findAll()).thenReturn(List.of(category));
        when(productRepository.findByCategorieId(10L)).thenReturn(List.of(first, hero));
        when(productImageRepository.findByProductIdOrderByOrdreAsc(any())).thenReturn(List.of());
        ProductDto firstDto = ProductDto.builder().id(1L).ref("B 1").categoryId(10L).build();
        when(productService.findById(1L)).thenReturn(firstDto);

        List<CategoryShowcaseDto> slides = categoryService.findShowcase();

        assertThat(slides).hasSize(1);
        assertThat(slides.get(0).getProduct().getId()).isEqualTo(1L);
    }
}
