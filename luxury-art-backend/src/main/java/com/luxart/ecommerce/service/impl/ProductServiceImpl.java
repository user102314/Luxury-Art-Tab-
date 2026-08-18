package com.luxart.ecommerce.service.impl;

import com.luxart.ecommerce.dto.ProductDto;
import com.luxart.ecommerce.dto.ProductImageDto;
import com.luxart.ecommerce.dto.TableauDimensionDto;
import com.luxart.ecommerce.exception.ResourceNotFoundException;
import com.luxart.ecommerce.model.entity.Category;
import com.luxart.ecommerce.model.entity.Product;
import com.luxart.ecommerce.model.entity.TableauDimension;
import com.luxart.ecommerce.repository.CategoryRepository;
import com.luxart.ecommerce.repository.ProductImageRepository;
import com.luxart.ecommerce.repository.ProductRepository;
import com.luxart.ecommerce.repository.TableauDimensionRepository;
import com.luxart.ecommerce.service.CatalogPricingService;
import com.luxart.ecommerce.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductImageRepository productImageRepository;
    private final TableauDimensionRepository dimensionRepository;
    private final CatalogPricingService catalogPricingService;

    @Override
    @Transactional(readOnly = true)
    public List<ProductDto> findAll() {
        Map<Long, BigDecimal> mins = catalogPricingService.minPriceByDimension();
        return productRepository.findAll().stream().map(p -> toDto(p, mins)).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ProductDto findById(Long id) {
        return toDto(getEntity(id), catalogPricingService.minPriceByDimension());
    }

    @Override
    @Transactional
    public ProductDto create(ProductDto dto) {
        Product product = Product.builder()
                .ref(dto.getRef().trim())
                .description(dto.getDescription())
                .categorie(getCategory(dto.getCategoryId()))
                .statut(dto.getStatut())
                .dimensions(resolveDimensions(dto.getDimensionIds()))
                .build();
        return toDto(productRepository.save(product), catalogPricingService.minPriceByDimension());
    }

    @Override
    @Transactional
    public ProductDto update(Long id, ProductDto dto) {
        Product product = getEntity(id);
        product.setRef(dto.getRef().trim());
        product.setDescription(dto.getDescription());
        product.setCategorie(getCategory(dto.getCategoryId()));
        product.setStatut(dto.getStatut());
        product.getDimensions().clear();
        product.getDimensions().addAll(resolveDimensions(dto.getDimensionIds()));
        return toDto(productRepository.save(product), catalogPricingService.minPriceByDimension());
    }

    @Override
    public void delete(Long id) {
        productRepository.delete(getEntity(id));
    }

    private List<TableauDimension> resolveDimensions(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Sélectionnez au moins une dimension pour ce tableau");
        }
        List<TableauDimension> found = dimensionRepository.findAllById(ids);
        if (found.size() != ids.stream().distinct().count()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dimension introuvable");
        }
        return new ArrayList<>(found);
    }

    private Product getEntity(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable: " + id));
    }

    private Category getCategory(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Catégorie introuvable: " + id));
    }

    private ProductDto toDto(Product product, Map<Long, BigDecimal> minByDimension) {
        List<ProductImageDto> images = productImageRepository
                .findByProductIdOrderByOrdreAsc(product.getId())
                .stream()
                .map(img -> ProductImageDto.builder()
                        .id(img.getId())
                        .productId(product.getId())
                        .url(img.getUrl())
                        .storagePath(img.getStoragePath())
                        .ordre(img.getOrdre())
                        .createdAt(img.getCreatedAt())
                        .build())
                .toList();

        List<TableauDimensionDto> dimensions = product.getDimensions() == null
                ? List.of()
                : product.getDimensions().stream()
                        .map(d -> TableauDimensionDto.builder()
                                .id(d.getId())
                                .label(d.getLabel())
                                .largeur(d.getLargeur())
                                .hauteur(d.getHauteur())
                                .ordre(d.getOrdre())
                                .build())
                        .toList();

        BigDecimal starting = dimensions.stream()
                .map(TableauDimensionDto::getId)
                .map(minByDimension::get)
                .filter(p -> p != null)
                .min(BigDecimal::compareTo)
                .orElse(null);

        return ProductDto.builder()
                .id(product.getId())
                .ref(product.getRef())
                .description(product.getDescription())
                .prix(starting)
                .dimensionIds(dimensions.stream().map(TableauDimensionDto::getId).toList())
                .dimensions(dimensions)
                .imageUrl(images.isEmpty() ? product.getImageUrl() : images.get(0).getUrl())
                .images(images)
                .categoryId(product.getCategorie() != null ? product.getCategorie().getId() : null)
                .statut(product.getStatut())
                .build();
    }
}
