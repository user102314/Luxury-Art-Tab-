package com.luxart.ecommerce.service.impl;

import com.luxart.ecommerce.dto.CategoryDto;
import com.luxart.ecommerce.dto.CategoryShowcaseDto;
import com.luxart.ecommerce.exception.ResourceNotFoundException;
import com.luxart.ecommerce.model.entity.Category;
import com.luxart.ecommerce.model.entity.Product;
import com.luxart.ecommerce.model.enums.AdminActionType;
import com.luxart.ecommerce.model.enums.ProductStatut;
import com.luxart.ecommerce.repository.CategoryRepository;
import com.luxart.ecommerce.repository.ProductImageRepository;
import com.luxart.ecommerce.repository.ProductRepository;
import com.luxart.ecommerce.service.CategoryService;
import com.luxart.ecommerce.service.ProductService;
import com.luxart.ecommerce.service.AdminAuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final ProductService productService;
    private final AdminAuditService adminAuditService;

    @Override
    public List<CategoryDto> findAll() {
        return categoryRepository.findAll().stream().map(this::toDto).toList();
    }

    @Override
    public List<CategoryShowcaseDto> findShowcase() {
        List<CategoryShowcaseDto> slides = new ArrayList<>();
        for (Category category : categoryRepository.findAll()) {
            List<Product> available = productRepository.findByCategorieId(category.getId()).stream()
                    .filter(p -> p.getStatut() != ProductStatut.ARCHIVE)
                    .toList();
            if (available.isEmpty()) {
                continue;
            }
            Product chosen = pickShowcaseProduct(available);
            slides.add(CategoryShowcaseDto.builder()
                    .categoryId(category.getId())
                    .nom(category.getNom())
                    .description(category.getDescription())
                    .product(productService.findById(chosen.getId()))
                    .build());
        }
        return slides;
    }

    @Override
    public CategoryDto findById(Long id) {
        return toDto(getEntity(id));
    }

    @Override
    public CategoryDto create(CategoryDto dto) {
        Category category = Category.builder()
                .nom(dto.getNom())
                .description(dto.getDescription())
                .build();
        Category saved = categoryRepository.save(category);
        CategoryDto result = toDto(saved);
        adminAuditService.logSuccess(
                AdminActionType.CATEGORY_CREATE,
                "CATEGORY",
                saved.getId(),
                null,
                saved.getNom(),
                null,
                null,
                dto,
                result,
                HttpStatus.CREATED.value()
        );
        return result;
    }

    @Override
    public CategoryDto update(Long id, CategoryDto dto) {
        Category category = getEntity(id);
        category.setNom(dto.getNom());
        category.setDescription(dto.getDescription());
        Category saved = categoryRepository.save(category);
        CategoryDto result = toDto(saved);
        adminAuditService.logSuccess(
                AdminActionType.CATEGORY_UPDATE,
                "CATEGORY",
                saved.getId(),
                null,
                saved.getNom(),
                null,
                null,
                dto,
                result,
                HttpStatus.OK.value()
        );
        return result;
    }

    @Override
    public void delete(Long id) {
        Category category = getEntity(id);
        String name = category.getNom();
        categoryRepository.delete(category);
        adminAuditService.logSuccess(
                AdminActionType.CATEGORY_DELETE,
                "CATEGORY",
                id,
                null,
                name,
                null,
                null,
                Map.of("id", id, "nom", name),
                Map.of("deleted", true),
                HttpStatus.NO_CONTENT.value()
        );
    }

    private Category getEntity(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Catégorie introuvable: " + id));
    }

    /** Premier produit prioritaire avec au moins 2 images (hero AR), sinon le plus prioritaire. */
    private Product pickShowcaseProduct(List<Product> available) {
        Comparator<Product> byPriority = Comparator
                .comparingInt((Product p) -> {
                    Integer order = p.getDisplayOrder();
                    return order == null || order <= 0 ? Integer.MAX_VALUE : order;
                })
                .thenComparing(Product::getId);
        return available.stream()
                .sorted(byPriority)
                .filter(p -> productImageRepository.findByProductIdOrderByOrdreAsc(p.getId()).size() >= 2)
                .findFirst()
                .orElseGet(() -> available.stream()
                        .min(byPriority)
                        .orElseThrow());
    }

    private CategoryDto toDto(Category category) {
        return CategoryDto.builder()
                .id(category.getId())
                .nom(category.getNom())
                .description(category.getDescription())
                .build();
    }
}
