package com.luxart.ecommerce.service.impl;

import com.luxart.ecommerce.dto.CadreCouleurDto;
import com.luxart.ecommerce.dto.CadreDto;
import com.luxart.ecommerce.dto.CatalogPricingDto;
import com.luxart.ecommerce.dto.DimensionCadrePrixDto;
import com.luxart.ecommerce.dto.TableauDimensionDto;
import com.luxart.ecommerce.exception.ResourceNotFoundException;
import com.luxart.ecommerce.model.entity.Cadre;
import com.luxart.ecommerce.model.entity.CadreCouleur;
import com.luxart.ecommerce.model.entity.DimensionCadrePrix;
import com.luxart.ecommerce.model.entity.Product;
import com.luxart.ecommerce.model.entity.TableauDimension;
import com.luxart.ecommerce.repository.CadreCouleurRepository;
import com.luxart.ecommerce.repository.CadreRepository;
import com.luxart.ecommerce.repository.DimensionCadrePrixRepository;
import com.luxart.ecommerce.repository.ProductRepository;
import com.luxart.ecommerce.repository.TableauDimensionRepository;
import com.luxart.ecommerce.service.CatalogPricingService;
import com.luxart.ecommerce.service.LocalFileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CatalogPricingServiceImpl implements CatalogPricingService {

    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif");

    private final TableauDimensionRepository dimensionRepository;
    private final CadreRepository cadreRepository;
    private final CadreCouleurRepository couleurRepository;
    private final DimensionCadrePrixRepository tarifRepository;
    private final ProductRepository productRepository;
    private final LocalFileStorageService localFileStorageService;

    @Override
    @Transactional(readOnly = true)
    public CatalogPricingDto getCatalog() {
        return CatalogPricingDto.builder()
                .dimensions(findDimensions())
                .cadres(findCadres())
                .tarifs(tarifRepository.findAll().stream().map(this::toTarifDto).toList())
                .build();
    }

    @Override
    public List<TableauDimensionDto> findDimensions() {
        return dimensionRepository.findAllByOrderByOrdreAscIdAsc().stream().map(this::toDimensionDto).toList();
    }

    @Override
    @Transactional
    public TableauDimensionDto createDimension(TableauDimensionDto dto) {
        String label = normalizeLabel(dto.getLabel());
        if (dimensionRepository.existsByLabelIgnoreCase(label)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dimension déjà existante: " + label);
        }
        int[] wh = parseSize(label);
        TableauDimension saved = dimensionRepository.save(TableauDimension.builder()
                .label(label)
                .largeur(dto.getLargeur() != null ? dto.getLargeur() : wh[0])
                .hauteur(dto.getHauteur() != null ? dto.getHauteur() : wh[1])
                .ordre(dto.getOrdre() != null ? dto.getOrdre() : nextDimensionOrdre())
                .build());
        ensureTarifRows(saved);
        return toDimensionDto(saved);
    }

    @Override
    @Transactional
    public TableauDimensionDto updateDimension(Long id, TableauDimensionDto dto) {
        TableauDimension dim = getDimension(id);
        String label = normalizeLabel(dto.getLabel());
        dimensionRepository.findByLabelIgnoreCase(label)
                .filter(other -> !other.getId().equals(id))
                .ifPresent(other -> {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dimension déjà existante: " + label);
                });
        int[] wh = parseSize(label);
        dim.setLabel(label);
        dim.setLargeur(dto.getLargeur() != null ? dto.getLargeur() : wh[0]);
        dim.setHauteur(dto.getHauteur() != null ? dto.getHauteur() : wh[1]);
        if (dto.getOrdre() != null) {
            dim.setOrdre(dto.getOrdre());
        }
        return toDimensionDto(dimensionRepository.save(dim));
    }

    @Override
    @Transactional
    public void deleteDimension(Long id) {
        TableauDimension dim = getDimension(id);
        tarifRepository.deleteByDimensionId(id);
        for (Product product : productRepository.findAll()) {
            if (product.getDimensions() != null) {
                product.getDimensions().removeIf(d -> Objects.equals(d.getId(), id));
            }
        }
        dimensionRepository.delete(dim);
    }

    @Override
    public List<CadreDto> findCadres() {
        return cadreRepository.findAllByOrderByOrdreAscIdAsc().stream().map(this::toCadreDto).toList();
    }

    @Override
    @Transactional
    public CadreDto createCadre(CadreDto dto) {
        String nom = dto.getNom().trim();
        if (cadreRepository.existsByNomIgnoreCase(nom)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cadre déjà existant: " + nom);
        }
        String code = dto.getCode() != null && !dto.getCode().isBlank()
                ? slug(dto.getCode())
                : slug(nom);
        if (cadreRepository.existsByCodeIgnoreCase(code)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Code cadre déjà existant: " + code);
        }
        Cadre saved = cadreRepository.save(Cadre.builder()
                .nom(nom)
                .code(code)
                .ordre(dto.getOrdre() != null ? dto.getOrdre() : nextCadreOrdre())
                .build());
        ensureTarifRows(saved);
        return toCadreDto(saved);
    }

    @Override
    @Transactional
    public CadreDto updateCadre(Long id, CadreDto dto) {
        Cadre cadre = getCadre(id);
        String nom = dto.getNom().trim();
        cadre.setNom(nom);
        if (dto.getCode() != null && !dto.getCode().isBlank()) {
            cadre.setCode(slug(dto.getCode()));
        }
        if (dto.getOrdre() != null) {
            cadre.setOrdre(dto.getOrdre());
        }
        return toCadreDto(cadreRepository.save(cadre));
    }

    @Override
    @Transactional
    public void deleteCadre(Long id) {
        Cadre cadre = getCadre(id);
        tarifRepository.deleteByCadreId(id);
        for (CadreCouleur couleur : couleurRepository.findByCadreIdOrderByOrdreAscIdAsc(id)) {
            deleteStoredImage(couleur.getImageUrl());
        }
        cadreRepository.delete(cadre);
    }

    @Override
    @Transactional
    public CadreCouleurDto createCouleur(Long cadreId, CadreCouleurDto dto) {
        Cadre cadre = getCadre(cadreId);
        String nom = dto.getNom().trim();
        if (couleurRepository.existsByCadreIdAndNomIgnoreCase(cadreId, nom)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Couleur déjà existante: " + nom);
        }
        CadreCouleur saved = couleurRepository.save(CadreCouleur.builder()
                .cadre(cadre)
                .nom(nom)
                .hex(blankToNull(dto.getHex()))
                .ordre(dto.getOrdre() != null ? dto.getOrdre() : cadre.getCouleurs().size())
                .build());
        return toCouleurDto(saved);
    }

    @Override
    @Transactional
    public CadreCouleurDto updateCouleur(Long couleurId, CadreCouleurDto dto) {
        CadreCouleur couleur = getCouleur(couleurId);
        couleur.setNom(dto.getNom().trim());
        couleur.setHex(blankToNull(dto.getHex()));
        if (dto.getOrdre() != null) {
            couleur.setOrdre(dto.getOrdre());
        }
        return toCouleurDto(couleurRepository.save(couleur));
    }

    @Override
    @Transactional
    public CadreCouleurDto uploadCouleurImage(Long couleurId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fichier image requis");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Format image non supporté");
        }
        CadreCouleur couleur = getCouleur(couleurId);
        deleteStoredImage(couleur.getImageUrl());
        try {
            String path = localFileStorageService.buildCadreCouleurStoragePath(
                    couleurId, file.getOriginalFilename());
            String url = localFileStorageService.upload(path, file.getBytes(), contentType);
            couleur.setImageUrl(url);
            return toCouleurDto(couleurRepository.save(couleur));
        } catch (java.io.IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Erreur upload image");
        }
    }

    @Override
    @Transactional
    public void deleteCouleur(Long couleurId) {
        CadreCouleur couleur = getCouleur(couleurId);
        deleteStoredImage(couleur.getImageUrl());
        couleurRepository.delete(couleur);
    }

    @Override
    @Transactional
    public DimensionCadrePrixDto upsertTarif(DimensionCadrePrixDto dto) {
        TableauDimension dim = getDimension(dto.getDimensionId());
        Cadre cadre = getCadre(dto.getCadreId());
        DimensionCadrePrix tarif = tarifRepository
                .findByDimensionIdAndCadreId(dim.getId(), cadre.getId())
                .orElseGet(() -> DimensionCadrePrix.builder().dimension(dim).cadre(cadre).build());
        tarif.setPrix(dto.getPrix());
        return toTarifDto(tarifRepository.save(tarif));
    }

    @Override
    @Transactional(readOnly = true)
    public Map<Long, BigDecimal> minPriceByDimension() {
        Map<Long, BigDecimal> mins = new HashMap<>();
        for (DimensionCadrePrix tarif : tarifRepository.findAll()) {
            if (tarif.getPrix() == null || tarif.getDimension() == null) {
                continue;
            }
            mins.merge(tarif.getDimension().getId(), tarif.getPrix(), (a, b) -> a.compareTo(b) <= 0 ? a : b);
        }
        return mins;
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal startingPrice(Collection<Long> dimensionIds) {
        if (dimensionIds == null || dimensionIds.isEmpty()) {
            return null;
        }
        Map<Long, BigDecimal> mins = minPriceByDimension();
        return dimensionIds.stream()
                .map(mins::get)
                .filter(Objects::nonNull)
                .min(Comparator.naturalOrder())
                .orElse(null);
    }

    @Override
    public BigDecimal startingPrice(Product product) {
        if (product == null || product.getDimensions() == null) {
            return null;
        }
        return startingPrice(product.getDimensions().stream().map(TableauDimension::getId).toList());
    }

    @Override
    public BigDecimal resolvePrice(Long dimensionId, Long cadreId) {
        return tarifRepository.findByDimensionIdAndCadreId(dimensionId, cadreId)
                .map(DimensionCadrePrix::getPrix)
                .filter(Objects::nonNull)
                .orElse(null);
    }

    private void ensureTarifRows(TableauDimension dim) {
        for (Cadre cadre : cadreRepository.findAll()) {
            tarifRepository.findByDimensionIdAndCadreId(dim.getId(), cadre.getId())
                    .orElseGet(() -> tarifRepository.save(DimensionCadrePrix.builder()
                            .dimension(dim)
                            .cadre(cadre)
                            .prix(null)
                            .build()));
        }
    }

    private void ensureTarifRows(Cadre cadre) {
        for (TableauDimension dim : dimensionRepository.findAll()) {
            tarifRepository.findByDimensionIdAndCadreId(dim.getId(), cadre.getId())
                    .orElseGet(() -> tarifRepository.save(DimensionCadrePrix.builder()
                            .dimension(dim)
                            .cadre(cadre)
                            .prix(null)
                            .build()));
        }
    }

    private TableauDimension getDimension(Long id) {
        return dimensionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Dimension introuvable: " + id));
    }

    private Cadre getCadre(Long id) {
        return cadreRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cadre introuvable: " + id));
    }

    private CadreCouleur getCouleur(Long id) {
        return couleurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Couleur introuvable: " + id));
    }

    private void deleteStoredImage(String imageUrl) {
        if (imageUrl == null || !imageUrl.startsWith("/uploads/")) {
            return;
        }
        localFileStorageService.delete(imageUrl.substring("/uploads/".length()));
    }

    private int nextDimensionOrdre() {
        return dimensionRepository.findAll().stream()
                .map(TableauDimension::getOrdre)
                .filter(Objects::nonNull)
                .max(Integer::compareTo)
                .orElse(-1) + 1;
    }

    private int nextCadreOrdre() {
        return cadreRepository.findAll().stream()
                .map(Cadre::getOrdre)
                .filter(Objects::nonNull)
                .max(Integer::compareTo)
                .orElse(-1) + 1;
    }

    private TableauDimensionDto toDimensionDto(TableauDimension dim) {
        return TableauDimensionDto.builder()
                .id(dim.getId())
                .label(dim.getLabel())
                .largeur(dim.getLargeur())
                .hauteur(dim.getHauteur())
                .ordre(dim.getOrdre())
                .build();
    }

    private CadreDto toCadreDto(Cadre cadre) {
        List<CadreCouleurDto> couleurs = couleurRepository
                .findByCadreIdOrderByOrdreAscIdAsc(cadre.getId())
                .stream()
                .map(this::toCouleurDto)
                .toList();
        return CadreDto.builder()
                .id(cadre.getId())
                .nom(cadre.getNom())
                .code(cadre.getCode())
                .ordre(cadre.getOrdre())
                .couleurs(couleurs)
                .build();
    }

    private CadreCouleurDto toCouleurDto(CadreCouleur couleur) {
        return CadreCouleurDto.builder()
                .id(couleur.getId())
                .cadreId(couleur.getCadre().getId())
                .nom(couleur.getNom())
                .hex(couleur.getHex())
                .imageUrl(couleur.getImageUrl())
                .ordre(couleur.getOrdre())
                .build();
    }

    private DimensionCadrePrixDto toTarifDto(DimensionCadrePrix tarif) {
        return DimensionCadrePrixDto.builder()
                .id(tarif.getId())
                .dimensionId(tarif.getDimension().getId())
                .dimensionLabel(tarif.getDimension().getLabel())
                .cadreId(tarif.getCadre().getId())
                .cadreNom(tarif.getCadre().getNom())
                .cadreCode(tarif.getCadre().getCode())
                .prix(tarif.getPrix())
                .build();
    }

    static String normalizeLabel(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dimension obligatoire");
        }
        return raw.trim().replace('×', '/').replace('x', '/').replace('X', '/').replace(" ", "");
    }

    static int[] parseSize(String label) {
        String[] parts = label.split("[/]");
        if (parts.length != 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Format dimension invalide (ex. 90/60)");
        }
        try {
            return new int[]{Integer.parseInt(parts[0].trim()), Integer.parseInt(parts[1].trim())};
        } catch (NumberFormatException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Format dimension invalide (ex. 90/60)");
        }
    }

    static String slug(String value) {
        String normalized = Normalizer.normalize(value.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toUpperCase(Locale.ROOT)
                .replaceAll("[^A-Z0-9]+", "_");
        return normalized.replaceAll("^_|_$", "");
    }

    static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
