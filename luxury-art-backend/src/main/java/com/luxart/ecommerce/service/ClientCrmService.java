package com.luxart.ecommerce.service;

import com.luxart.ecommerce.dto.ClientCrmDto;

import java.util.List;

public interface ClientCrmService {
    List<ClientCrmDto> findAllClients();
    ClientCrmDto findByUserId(Long userId);
}
