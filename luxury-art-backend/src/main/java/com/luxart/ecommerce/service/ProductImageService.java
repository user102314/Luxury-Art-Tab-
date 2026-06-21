package com.luxart.ecommerce.service;

import com.luxart.ecommerce.dto.ProductImageDto;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ProductImageService {
    List<ProductImageDto> findByProductId(Long productId);
    List<ProductImageDto> uploadImages(Long productId, MultipartFile[] files);
    void deleteImage(Long imageId);
}
