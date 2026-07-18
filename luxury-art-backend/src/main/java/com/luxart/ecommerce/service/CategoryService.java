package com.luxart.ecommerce.service;

import com.luxart.ecommerce.dto.CategoryDto;
import com.luxart.ecommerce.dto.CategoryShowcaseDto;

import java.util.List;

public interface CategoryService {
    List<CategoryDto> findAll();
    List<CategoryShowcaseDto> findShowcase();
    CategoryDto findById(Long id);
    CategoryDto create(CategoryDto dto);
    CategoryDto update(Long id, CategoryDto dto);
    void delete(Long id);
}
