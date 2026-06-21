package com.luxart.ecommerce.service.impl;

import com.luxart.ecommerce.dto.OrderItemDto;
import com.luxart.ecommerce.exception.ResourceNotFoundException;
import com.luxart.ecommerce.model.entity.Order;
import com.luxart.ecommerce.model.entity.OrderItem;
import com.luxart.ecommerce.model.entity.Product;
import com.luxart.ecommerce.repository.OrderItemRepository;
import com.luxart.ecommerce.repository.OrderRepository;
import com.luxart.ecommerce.repository.ProductRepository;
import com.luxart.ecommerce.service.OrderItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderItemServiceImpl implements OrderItemService {

    private final OrderItemRepository orderItemRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    @Override
    public List<OrderItemDto> findAll() {
        return orderItemRepository.findAll().stream().map(this::toDto).toList();
    }

    @Override
    public OrderItemDto findById(Long id) {
        return toDto(getEntity(id));
    }

    @Override
    public OrderItemDto create(OrderItemDto dto) {
        OrderItem item = OrderItem.builder()
                .order(getOrder(dto.getOrderId()))
                .product(getProduct(dto.getProductId()))
                .quantite(dto.getQuantite())
                .prixUnitaire(dto.getPrixUnitaire())
                .build();
        return toDto(orderItemRepository.save(item));
    }

    @Override
    public OrderItemDto update(Long id, OrderItemDto dto) {
        OrderItem item = getEntity(id);
        item.setOrder(getOrder(dto.getOrderId()));
        item.setProduct(getProduct(dto.getProductId()));
        item.setQuantite(dto.getQuantite());
        item.setPrixUnitaire(dto.getPrixUnitaire());
        return toDto(orderItemRepository.save(item));
    }

    @Override
    public void delete(Long id) {
        orderItemRepository.delete(getEntity(id));
    }

    private OrderItem getEntity(Long id) {
        return orderItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ligne de commande introuvable: " + id));
    }

    private Order getOrder(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Commande introuvable: " + id));
    }

    private Product getProduct(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable: " + id));
    }

    private OrderItemDto toDto(OrderItem item) {
        return OrderItemDto.builder()
                .id(item.getId())
                .orderId(item.getOrder().getId())
                .productId(item.getProduct().getId())
                .quantite(item.getQuantite())
                .prixUnitaire(item.getPrixUnitaire())
                .build();
    }
}
