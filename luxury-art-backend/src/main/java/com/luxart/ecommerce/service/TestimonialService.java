package com.luxart.ecommerce.service;

import com.luxart.ecommerce.dto.TestimonialDto;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface TestimonialService {
    List<TestimonialDto> findAll();
    List<TestimonialDto> findActive();
    TestimonialDto findById(Long id);
    TestimonialDto create(TestimonialDto dto);
    TestimonialDto update(Long id, TestimonialDto dto);
    void delete(Long id);
    TestimonialDto uploadImage(Long id, MultipartFile file);
}
