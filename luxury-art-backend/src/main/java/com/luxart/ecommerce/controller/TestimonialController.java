package com.luxart.ecommerce.controller;

import com.luxart.ecommerce.dto.TestimonialDto;
import com.luxart.ecommerce.service.TestimonialService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/testimonials")
@RequiredArgsConstructor
public class TestimonialController {

    private final TestimonialService testimonialService;

    @GetMapping
    public ResponseEntity<List<TestimonialDto>> getAll() {
        return ResponseEntity.ok(testimonialService.findAll());
    }

    @GetMapping("/active")
    public ResponseEntity<List<TestimonialDto>> getActive() {
        return ResponseEntity.ok(testimonialService.findActive());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TestimonialDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(testimonialService.findById(id));
    }

    @PostMapping
    public ResponseEntity<TestimonialDto> create(@Valid @RequestBody TestimonialDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(testimonialService.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TestimonialDto> update(@PathVariable Long id, @Valid @RequestBody TestimonialDto dto) {
        return ResponseEntity.ok(testimonialService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        testimonialService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<TestimonialDto> uploadImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(testimonialService.uploadImage(id, file));
    }
}
