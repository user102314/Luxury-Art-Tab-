package com.luxart.ecommerce.controller;

import com.luxart.ecommerce.dto.CadreCouleurDto;
import com.luxart.ecommerce.dto.CadreDto;
import com.luxart.ecommerce.dto.CatalogPricingDto;
import com.luxart.ecommerce.dto.DimensionCadrePrixDto;
import com.luxart.ecommerce.dto.TableauDimensionDto;
import com.luxart.ecommerce.service.CatalogPricingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/catalog")
@RequiredArgsConstructor
public class CatalogPricingController {

    private final CatalogPricingService catalogPricingService;

    @GetMapping("/pricing")
    public ResponseEntity<CatalogPricingDto> getPricing() {
        return ResponseEntity.ok(catalogPricingService.getCatalog());
    }

    @GetMapping("/dimensions")
    public ResponseEntity<List<TableauDimensionDto>> getDimensions() {
        return ResponseEntity.ok(catalogPricingService.findDimensions());
    }

    @PostMapping("/dimensions")
    public ResponseEntity<TableauDimensionDto> createDimension(@Valid @RequestBody TableauDimensionDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(catalogPricingService.createDimension(dto));
    }

    @PutMapping("/dimensions/{id}")
    public ResponseEntity<TableauDimensionDto> updateDimension(
            @PathVariable Long id,
            @Valid @RequestBody TableauDimensionDto dto) {
        return ResponseEntity.ok(catalogPricingService.updateDimension(id, dto));
    }

    @DeleteMapping("/dimensions/{id}")
    public ResponseEntity<Void> deleteDimension(@PathVariable Long id) {
        catalogPricingService.deleteDimension(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/cadres")
    public ResponseEntity<List<CadreDto>> getCadres() {
        return ResponseEntity.ok(catalogPricingService.findCadres());
    }

    @PostMapping("/cadres")
    public ResponseEntity<CadreDto> createCadre(@Valid @RequestBody CadreDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(catalogPricingService.createCadre(dto));
    }

    @PutMapping("/cadres/{id}")
    public ResponseEntity<CadreDto> updateCadre(@PathVariable Long id, @Valid @RequestBody CadreDto dto) {
        return ResponseEntity.ok(catalogPricingService.updateCadre(id, dto));
    }

    @DeleteMapping("/cadres/{id}")
    public ResponseEntity<Void> deleteCadre(@PathVariable Long id) {
        catalogPricingService.deleteCadre(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/cadres/{cadreId}/couleurs")
    public ResponseEntity<CadreCouleurDto> createCouleur(
            @PathVariable Long cadreId,
            @Valid @RequestBody CadreCouleurDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(catalogPricingService.createCouleur(cadreId, dto));
    }

    @PutMapping("/couleurs/{id}")
    public ResponseEntity<CadreCouleurDto> updateCouleur(
            @PathVariable Long id,
            @Valid @RequestBody CadreCouleurDto dto) {
        return ResponseEntity.ok(catalogPricingService.updateCouleur(id, dto));
    }

    @PostMapping(value = "/couleurs/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CadreCouleurDto> uploadCouleurImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(catalogPricingService.uploadCouleurImage(id, file));
    }

    @DeleteMapping("/couleurs/{id}")
    public ResponseEntity<Void> deleteCouleur(@PathVariable Long id) {
        catalogPricingService.deleteCouleur(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/tarifs")
    public ResponseEntity<DimensionCadrePrixDto> upsertTarif(@RequestBody DimensionCadrePrixDto dto) {
        return ResponseEntity.ok(catalogPricingService.upsertTarif(dto));
    }
}
