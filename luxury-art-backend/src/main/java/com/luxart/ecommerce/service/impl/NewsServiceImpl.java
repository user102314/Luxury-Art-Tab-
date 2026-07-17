package com.luxart.ecommerce.service.impl;

import com.luxart.ecommerce.dto.NewsDto;
import com.luxart.ecommerce.exception.ResourceNotFoundException;
import com.luxart.ecommerce.model.entity.News;
import com.luxart.ecommerce.model.entity.User;
import com.luxart.ecommerce.model.enums.NewsStatut;
import com.luxart.ecommerce.repository.NewsRepository;
import com.luxart.ecommerce.repository.UserRepository;
import com.luxart.ecommerce.service.LocalFileStorageService;
import com.luxart.ecommerce.service.NewsService;
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
public class NewsServiceImpl implements NewsService {

    private static final Set<String> ALLOWED = Set.of(
            "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif");

    private final NewsRepository newsRepository;
    private final UserRepository userRepository;
    private final LocalFileStorageService localFileStorageService;

    @Override
    public List<NewsDto> findAll() {
        return newsRepository.findAll().stream().map(this::toDto).toList();
    }

    @Override
    public List<NewsDto> findPublished() {
        return newsRepository.findByStatutOrderByPublishedAtDesc(NewsStatut.PUBLIE)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    public NewsDto findById(Long id) {
        return toDto(getEntity(id));
    }

    @Override
    public NewsDto create(NewsDto dto) {
        News news = News.builder()
                .titre(dto.getTitre())
                .resume(dto.getResume())
                .contenu(dto.getContenu())
                .imageUrl(dto.getImageUrl())
                .auteur(getAuteur(dto.getAuteurId()))
                .statut(dto.getStatut() != null ? dto.getStatut() : NewsStatut.BROUILLON)
                .build();
        return toDto(newsRepository.save(news));
    }

    @Override
    public NewsDto update(Long id, NewsDto dto) {
        News news = getEntity(id);
        news.setTitre(dto.getTitre());
        news.setResume(dto.getResume());
        news.setContenu(dto.getContenu());
        news.setImageUrl(dto.getImageUrl());
        if (dto.getStatut() != null) {
            news.setStatut(dto.getStatut());
        }
        return toDto(newsRepository.save(news));
    }

    @Override
    public void delete(Long id) {
        newsRepository.delete(getEntity(id));
    }

    @Override
    public NewsDto publier(Long id) {
        News news = getEntity(id);
        news.publier();
        return toDto(newsRepository.save(news));
    }

    @Override
    @Transactional
    public NewsDto uploadImage(Long id, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fichier image requis");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED.contains(contentType.toLowerCase())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Format image non supporté");
        }
        News news = getEntity(id);
        try {
            String path = localFileStorageService.buildNewsStoragePath(id, file.getOriginalFilename());
            String url = localFileStorageService.upload(path, file.getBytes(), contentType);
            news.setImageUrl(url);
            return toDto(newsRepository.save(news));
        } catch (java.io.IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Erreur upload image");
        }
    }

    private News getEntity(Long id) {
        return newsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Article introuvable: " + id));
    }

    private User getAuteur(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Auteur introuvable: " + id));
    }

    private NewsDto toDto(News news) {
        return NewsDto.builder()
                .id(news.getId())
                .titre(news.getTitre())
                .resume(news.getResume())
                .contenu(news.getContenu())
                .imageUrl(news.getImageUrl())
                .auteurId(news.getAuteur().getId())
                .auteurNom(news.getAuteur().getNom())
                .statut(news.getStatut())
                .createdAt(news.getCreatedAt())
                .publishedAt(news.getPublishedAt())
                .build();
    }
}
