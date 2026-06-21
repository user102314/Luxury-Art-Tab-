package com.luxart.ecommerce.service.impl;

import com.luxart.ecommerce.dto.*;
import com.luxart.ecommerce.exception.ResourceNotFoundException;
import com.luxart.ecommerce.model.entity.OrderItem;
import com.luxart.ecommerce.model.entity.Product;
import com.luxart.ecommerce.model.entity.ProductLike;
import com.luxart.ecommerce.model.entity.Review;
import com.luxart.ecommerce.repository.*;
import com.luxart.ecommerce.service.ProductAnalyticsService;
import com.luxart.ecommerce.service.ProductCommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductAnalyticsServiceImpl implements ProductAnalyticsService {

    private final ProductRepository productRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductLikeRepository productLikeRepository;
    private final ReviewRepository reviewRepository;
    private final ProductCommentService productCommentService;

    @Override
    public List<ProductBestSellerDto> getBestSellers() {
        Map<Long, SalesAgg> sales = aggregateSales();

        return sales.entrySet().stream()
                .sorted(Comparator.comparing((Map.Entry<Long, SalesAgg> e) -> e.getValue().quantite()).reversed())
                .map(e -> {
                    Product p = productRepository.findById(e.getKey()).orElse(null);
                    return ProductBestSellerDto.builder()
                            .productId(e.getKey())
                            .nom(p != null ? p.getNom() : "Produit #" + e.getKey())
                            .quantiteVendue(e.getValue().quantite())
                            .chiffreAffaires(e.getValue().ca())
                            .build();
                })
                .toList();
    }

    @Override
    public ProductAnalyticsDto getAnalytics(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable: " + productId));

        List<ProductLike> likes = productLikeRepository.findByProductIdOrderByCreatedAtDesc(productId);
        List<ProductCommentDto> comments = productCommentService.findByProductId(productId);
        List<Review> reviews = reviewRepository.findByProductId(productId);

        SalesAgg sales = aggregateSales().getOrDefault(productId, new SalesAgg(0L, BigDecimal.ZERO));

        double avgNote = reviews.stream().mapToInt(Review::getNote).average().orElse(0);

        List<ProductLikeDto> likeDtos = likes.stream().map(l -> ProductLikeDto.builder()
                .id(l.getId())
                .userId(l.getUser().getId())
                .userNom(l.getUser().getNom())
                .productId(productId)
                .createdAt(l.getCreatedAt())
                .build()).toList();

        return ProductAnalyticsDto.builder()
                .productId(productId)
                .nom(product.getNom())
                .nombreJaimes(likes.size())
                .nombreCommentaires(comments.size())
                .nombreAvis(reviews.size())
                .noteMoyenne(Math.round(avgNote * 10) / 10.0)
                .quantiteVendue(sales.quantite())
                .chiffreAffaires(sales.ca())
                .jaimes(likeDtos)
                .commentaires(comments)
                .build();
    }

    private Map<Long, SalesAgg> aggregateSales() {
        List<OrderItem> items = orderItemRepository.findAll();
        Map<Long, SalesAgg> map = new HashMap<>();
        for (OrderItem item : items) {
            Long pid = item.getProduct().getId();
            long qty = item.getQuantite();
            BigDecimal line = item.getPrixUnitaire().multiply(BigDecimal.valueOf(qty));
            map.merge(pid, new SalesAgg(qty, line), (a, b) ->
                    new SalesAgg(a.quantite() + b.quantite(), a.ca().add(b.ca())));
        }
        return map;
    }

    private record SalesAgg(long quantite, BigDecimal ca) {}
}
