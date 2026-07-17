package com.luxart.ecommerce.controller;

import com.luxart.ecommerce.dto.NewsDto;
import com.luxart.ecommerce.service.NewsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/news")
@RequiredArgsConstructor
public class NewsController {

    private final NewsService newsService;

    @GetMapping
    public ResponseEntity<List<NewsDto>> getAll() {
        return ResponseEntity.ok(newsService.findAll());
    }

    @GetMapping("/published")
    public ResponseEntity<List<NewsDto>> getPublished() {
        return ResponseEntity.ok(newsService.findPublished());
    }

    @GetMapping("/{id}")
    public ResponseEntity<NewsDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(newsService.findById(id));
    }

    @PostMapping
    public ResponseEntity<NewsDto> create(@Valid @RequestBody NewsDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(newsService.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<NewsDto> update(@PathVariable Long id, @Valid @RequestBody NewsDto dto) {
        return ResponseEntity.ok(newsService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        newsService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/publish")
    public ResponseEntity<NewsDto> publish(@PathVariable Long id) {
        return ResponseEntity.ok(newsService.publier(id));
    }

    @PostMapping(value = "/{id}/image", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<NewsDto> uploadImage(
            @PathVariable Long id,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        return ResponseEntity.ok(newsService.uploadImage(id, file));
    }
}
