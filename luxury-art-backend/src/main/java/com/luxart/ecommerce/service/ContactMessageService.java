package com.luxart.ecommerce.service;

import com.luxart.ecommerce.dto.ContactMessageDto;

import java.util.List;

public interface ContactMessageService {
    List<ContactMessageDto> findAll();
    ContactMessageDto findById(Long id);
    ContactMessageDto create(ContactMessageDto dto);
    ContactMessageDto update(Long id, ContactMessageDto dto);
    void delete(Long id);
    ContactMessageDto markRead(Long id);
}
