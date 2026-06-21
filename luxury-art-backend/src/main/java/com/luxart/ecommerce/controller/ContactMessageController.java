package com.luxart.ecommerce.controller;

import com.luxart.ecommerce.dto.ContactMessageDto;
import com.luxart.ecommerce.service.ContactMessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contact-messages")
@RequiredArgsConstructor
public class ContactMessageController {

    private final ContactMessageService contactMessageService;

    @GetMapping
    public ResponseEntity<List<ContactMessageDto>> getAll() {
        return ResponseEntity.ok(contactMessageService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ContactMessageDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(contactMessageService.findById(id));
    }

    @PostMapping
    public ResponseEntity<ContactMessageDto> create(@Valid @RequestBody ContactMessageDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(contactMessageService.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ContactMessageDto> update(@PathVariable Long id, @Valid @RequestBody ContactMessageDto dto) {
        return ResponseEntity.ok(contactMessageService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        contactMessageService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/mark-read")
    public ResponseEntity<ContactMessageDto> markRead(@PathVariable Long id) {
        return ResponseEntity.ok(contactMessageService.markRead(id));
    }
}
