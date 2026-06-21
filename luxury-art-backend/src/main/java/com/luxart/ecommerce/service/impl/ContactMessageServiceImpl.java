package com.luxart.ecommerce.service.impl;

import com.luxart.ecommerce.dto.ContactMessageDto;
import com.luxart.ecommerce.exception.ResourceNotFoundException;
import com.luxart.ecommerce.model.entity.ContactMessage;
import com.luxart.ecommerce.model.enums.ContactMessageStatut;
import com.luxart.ecommerce.repository.ContactMessageRepository;
import com.luxart.ecommerce.service.ContactMessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ContactMessageServiceImpl implements ContactMessageService {

    private final ContactMessageRepository contactMessageRepository;

    @Override
    public List<ContactMessageDto> findAll() {
        return contactMessageRepository.findAll().stream().map(this::toDto).toList();
    }

    @Override
    public ContactMessageDto findById(Long id) {
        return toDto(getEntity(id));
    }

    @Override
    public ContactMessageDto create(ContactMessageDto dto) {
        ContactMessage message = ContactMessage.builder()
                .nom(dto.getNom())
                .email(dto.getEmail())
                .sujet(dto.getSujet())
                .message(dto.getMessage())
                .statut(dto.getStatut() != null ? dto.getStatut() : ContactMessageStatut.NON_LU)
                .build();
        return toDto(contactMessageRepository.save(message));
    }

    @Override
    public ContactMessageDto update(Long id, ContactMessageDto dto) {
        ContactMessage message = getEntity(id);
        message.setNom(dto.getNom());
        message.setEmail(dto.getEmail());
        message.setSujet(dto.getSujet());
        message.setMessage(dto.getMessage());
        if (dto.getStatut() != null) {
            message.setStatut(dto.getStatut());
        }
        return toDto(contactMessageRepository.save(message));
    }

    @Override
    public void delete(Long id) {
        contactMessageRepository.delete(getEntity(id));
    }

    @Override
    public ContactMessageDto markRead(Long id) {
        ContactMessage message = getEntity(id);
        message.markRead();
        return toDto(contactMessageRepository.save(message));
    }

    private ContactMessage getEntity(Long id) {
        return contactMessageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Message introuvable: " + id));
    }

    private ContactMessageDto toDto(ContactMessage message) {
        return ContactMessageDto.builder()
                .id(message.getId())
                .nom(message.getNom())
                .email(message.getEmail())
                .sujet(message.getSujet())
                .message(message.getMessage())
                .statut(message.getStatut())
                .build();
    }
}
