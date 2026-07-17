package com.luxart.ecommerce.service;

import com.luxart.ecommerce.dto.*;
import com.luxart.ecommerce.model.enums.OrderCanal;

import java.util.List;

public interface OrderService {
    List<OrderDto> findAll();
    List<OrderDto> findByCanal(OrderCanal canal);
    OrderDto findById(Long id);
    OrderDto create(OrderDto dto);
    OrderDto update(Long id, OrderDto dto);
    void delete(Long id);
    OrderDto createFacebookOrder(FacebookOrderCreateDto dto);
    OrderDto createInstagramOrder(InstagramOrderCreateDto dto);
    OrderDto createWhatsAppOrder(WhatsAppOrderCreateDto dto);
    OrderChannelStatsDto getChannelStats();
}
