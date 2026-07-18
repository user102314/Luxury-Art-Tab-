package com.luxart.ecommerce.service.impl;

import com.luxart.ecommerce.dto.CategoryDto;
import com.luxart.ecommerce.dto.CategoryShowcaseDto;
import com.luxart.ecommerce.exception.ResourceNotFoundException;
import com.luxart.ecommerce.model.entity.Category;
import com.luxart.ecommerce.model.entity.Product;
import com.luxart.ecommerce.model.enums.ProductStatut;
import com.luxart.ecommerce.repository.CategoryRepository;
import com.luxart.ecommerce.repository.ProductRepository;
import com.luxart.ecommerce.service.CategoryService;
import com.luxart.ecommerce.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final ProductService productService;

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
            Product chosen = available.get(ThreadLocalRandom.current().nextInt(available.size()));
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
        return toDto(categoryRepository.save(category));
    }

    @Override
    public CategoryDto update(Long id, CategoryDto dto) {
        Category category = getEntity(id);
        category.setNom(dto.getNom());
        category.setDescription(dto.getDescription());
        return toDto(categoryRepository.save(category));
    }

    @Override
    public void delete(Long id) {
        categoryRepository.delete(getEntity(id));
    }

    private Category getEntity(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Catégorie introuvable: " + id));
    }

    private CategoryDto toDto(Category category) {
        return CategoryDto.builder()
                .id(category.getId())
                .nom(category.getNom())
                .description(category.getDescription())
                .build();
    }
}
