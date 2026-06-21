package com.luxart.ecommerce.service;

import com.luxart.ecommerce.dto.ReviewDto;

import java.util.List;

public interface ReviewService {
    List<ReviewDto> findAll();
    ReviewDto findById(Long id);
    ReviewDto create(ReviewDto dto);
    ReviewDto update(Long id, ReviewDto dto);
    void delete(Long id);
    ReviewDto approuver(Long id);

    List<ReviewDto> findApprovedByProductId(Long productId);
}
