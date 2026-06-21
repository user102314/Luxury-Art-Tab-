package com.luxart.ecommerce.service;

import com.luxart.ecommerce.dto.OrderItemDto;

import java.util.List;

public interface OrderItemService {
    List<OrderItemDto> findAll();
    OrderItemDto findById(Long id);
    OrderItemDto create(OrderItemDto dto);
    OrderItemDto update(Long id, OrderItemDto dto);
    void delete(Long id);
}
