package com.luxart.ecommerce.service.impl;

import com.luxart.ecommerce.dto.CategoryDto;
import com.luxart.ecommerce.exception.ResourceNotFoundException;
import com.luxart.ecommerce.model.entity.Category;
import com.luxart.ecommerce.repository.CategoryRepository;
import com.luxart.ecommerce.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    @Override
    public List<CategoryDto> findAll() {
        return categoryRepository.findAll().stream().map(this::toDto).toList();
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
