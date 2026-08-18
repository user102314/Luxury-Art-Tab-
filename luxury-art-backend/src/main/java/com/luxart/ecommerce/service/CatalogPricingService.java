package com.luxart.ecommerce.service;

import com.luxart.ecommerce.dto.CadreCouleurDto;
import com.luxart.ecommerce.dto.CadreDto;
import com.luxart.ecommerce.dto.CatalogPricingDto;
import com.luxart.ecommerce.dto.DimensionCadrePrixDto;
import com.luxart.ecommerce.dto.TableauDimensionDto;
import com.luxart.ecommerce.model.entity.Product;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Map;

public interface CatalogPricingService {
    CatalogPricingDto getCatalog();

    List<TableauDimensionDto> findDimensions();
    TableauDimensionDto createDimension(TableauDimensionDto dto);
    TableauDimensionDto updateDimension(Long id, TableauDimensionDto dto);
    void deleteDimension(Long id);

    List<CadreDto> findCadres();
    CadreDto createCadre(CadreDto dto);
    CadreDto updateCadre(Long id, CadreDto dto);
    void deleteCadre(Long id);

    CadreCouleurDto createCouleur(Long cadreId, CadreCouleurDto dto);
    CadreCouleurDto updateCouleur(Long couleurId, CadreCouleurDto dto);
    CadreCouleurDto uploadCouleurImage(Long couleurId, MultipartFile file);
    void deleteCouleur(Long couleurId);

    DimensionCadrePrixDto upsertTarif(DimensionCadrePrixDto dto);

    Map<Long, BigDecimal> minPriceByDimension();
    BigDecimal startingPrice(Collection<Long> dimensionIds);
    BigDecimal startingPrice(Product product);
    BigDecimal resolvePrice(Long dimensionId, Long cadreId);
}
