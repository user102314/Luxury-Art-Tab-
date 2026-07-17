package com.luxart.ecommerce.service;

import com.luxart.ecommerce.dto.NewsDto;

import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface NewsService {
    List<NewsDto> findAll();
    List<NewsDto> findPublished();
    NewsDto findById(Long id);
    NewsDto create(NewsDto dto);
    NewsDto update(Long id, NewsDto dto);
    void delete(Long id);
    NewsDto publier(Long id);
    NewsDto uploadImage(Long id, MultipartFile file);
}
