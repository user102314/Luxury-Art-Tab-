package com.luxart.ecommerce.service.impl;

import com.luxart.ecommerce.dto.TestimonialDto;
import com.luxart.ecommerce.exception.ResourceNotFoundException;
import com.luxart.ecommerce.model.entity.Testimonial;
import com.luxart.ecommerce.model.enums.TestimonialPlateforme;
import com.luxart.ecommerce.repository.TestimonialRepository;
import com.luxart.ecommerce.service.ImageConversionService;
import com.luxart.ecommerce.service.LocalFileStorageService;
import com.luxart.ecommerce.service.TestimonialService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class TestimonialServiceImpl implements TestimonialService {

    private static final Set<String> ALLOWED = Set.of(
            "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif");

    private final TestimonialRepository testimonialRepository;
    private final LocalFileStorageService localFileStorageService;
    private final ImageConversionService imageConversionService;

    @Override
    public List<TestimonialDto> findAll() {
        return testimonialRepository.findAllByOrderByOrdreAscCreatedAtDesc().stream().map(this::toDto).toList();
    }

    @Override
    public List<TestimonialDto> findActive() {
        return testimonialRepository.findByActifTrueOrderByOrdreAscCreatedAtDesc().stream().map(this::toDto).toList();
    }

    @Override
    public TestimonialDto findById(Long id) {
        return toDto(getEntity(id));
    }

    @Override
    public TestimonialDto create(TestimonialDto dto) {
        Testimonial t = Testimonial.builder()
                .clientNom(dto.getClientNom())
                .message(dto.getMessage())
                .plateforme(dto.getPlateforme() != null ? dto.getPlateforme() : TestimonialPlateforme.AUTRE)
                .imageUrl(dto.getImageUrl())
                .avatarUrl(dto.getAvatarUrl())
                .reponseBoutique(dto.getReponseBoutique())
                .actif(dto.getActif() != null ? dto.getActif() : true)
                .ordre(dto.getOrdre() != null ? dto.getOrdre() : 0)
                .build();
        return toDto(testimonialRepository.save(t));
    }

    @Override
    public TestimonialDto update(Long id, TestimonialDto dto) {
        Testimonial t = getEntity(id);
        t.setClientNom(dto.getClientNom());
        t.setMessage(dto.getMessage());
        if (dto.getPlateforme() != null) t.setPlateforme(dto.getPlateforme());
        t.setImageUrl(dto.getImageUrl());
        t.setAvatarUrl(dto.getAvatarUrl());
        t.setReponseBoutique(dto.getReponseBoutique());
        if (dto.getActif() != null) t.setActif(dto.getActif());
        if (dto.getOrdre() != null) t.setOrdre(dto.getOrdre());
        return toDto(testimonialRepository.save(t));
    }

    @Override
    public void delete(Long id) {
        testimonialRepository.delete(getEntity(id));
    }

    @Override
    @Transactional
    public TestimonialDto uploadImage(Long id, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fichier image requis");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED.contains(contentType.toLowerCase())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Format image non supporté");
        }
        Testimonial t = getEntity(id);
        try {
            ImageConversionService.ConvertedImage converted =
                    imageConversionService.convertToWebp(file.getBytes(), contentType, 900);
            String path = localFileStorageService.buildTestimonialStoragePath(id, file.getOriginalFilename());
            if (!path.toLowerCase().endsWith(".webp")) {
                int dot = path.lastIndexOf('.');
                path = (dot > path.lastIndexOf('/') ? path.substring(0, dot) : path) + ".webp";
            }
            String url = localFileStorageService.upload(path, converted.data(), converted.contentType());
            t.setImageUrl(url);
            return toDto(testimonialRepository.save(t));
        } catch (java.io.IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Erreur upload image");
        }
    }

    private Testimonial getEntity(Long id) {
        return testimonialRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Avis introuvable: " + id));
    }

    private TestimonialDto toDto(Testimonial t) {
        return TestimonialDto.builder()
                .id(t.getId())
                .clientNom(t.getClientNom())
                .message(t.getMessage())
                .plateforme(t.getPlateforme())
                .imageUrl(t.getImageUrl())
                .avatarUrl(t.getAvatarUrl())
                .reponseBoutique(t.getReponseBoutique())
                .actif(t.getActif())
                .ordre(t.getOrdre())
                .createdAt(t.getCreatedAt())
                .build();
    }
}
