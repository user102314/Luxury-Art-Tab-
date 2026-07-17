package com.luxart.ecommerce.event;

import com.luxart.ecommerce.dto.OrderDto;

public record OrderCreatedEvent(OrderDto order) {}
