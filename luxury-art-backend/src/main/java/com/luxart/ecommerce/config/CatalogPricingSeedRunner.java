package com.luxart.ecommerce.config;

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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
@Order(20)
@RequiredArgsConstructor
@Slf4j
public class CatalogPricingSeedRunner implements CommandLineRunner {

    private final TableauDimensionRepository dimensionRepository;
    private final CadreRepository cadreRepository;
    private final CadreCouleurRepository couleurRepository;
    private final DimensionCadrePrixRepository tarifRepository;
    private final ProductRepository productRepository;

    private static final List<int[]> SIZES = List.of(
            new int[]{30, 40},
            new int[]{40, 60},
            new int[]{70, 50},
            new int[]{80, 60},
            new int[]{90, 60},
            new int[]{100, 70},
            new int[]{120, 80},
            new int[]{140, 90},
            new int[]{160, 100}
    );

    @Override
    @Transactional
    public void run(String... args) {
        seedDimensions();
        Cadre sans = seedCadre("Sans cadre", "SANS_CADRE", 0);
        Cadre large = seedCadre("Cadre large", "CADRE_LARGE", 1);
        Cadre amer = seedCadre("Cadre américain", "CAISSE_AMERICAINE", 2);

        seedCouleurs(amer, List.of(
                color("Noir", "#111111", 0),
                color("Doré", "#C7A158", 1)
        ));
        seedCouleurs(large, List.of(
                color("Noir", "#111111", 0),
                color("Bleu", "#1E4B8E", 1),
                color("Doré", "#C7A158", 2),
                color("Argenté", "#C0C0C0", 3),
                color("Effet bois", "#8B5A2B", 4)
        ));

        seedTarifs(sans, large, amer);
        assignDimensionsToExistingProducts();
    }

    private void seedDimensions() {
        int ordre = 0;
        for (int[] size : SIZES) {
            String label = size[0] + "/" + size[1];
            if (dimensionRepository.findByLabelIgnoreCase(label).isEmpty()) {
                dimensionRepository.save(TableauDimension.builder()
                        .label(label)
                        .largeur(size[0])
                        .hauteur(size[1])
                        .ordre(ordre)
                        .build());
                log.info("Dimension catalogue créée : {}", label);
            }
            ordre++;
        }
    }

    private Cadre seedCadre(String nom, String code, int ordre) {
        return cadreRepository.findByCodeIgnoreCase(code).orElseGet(() -> {
            Cadre saved = cadreRepository.save(Cadre.builder()
                    .nom(nom)
                    .code(code)
                    .ordre(ordre)
                    .build());
            log.info("Cadre créé : {}", nom);
            return saved;
        });
    }

    private void seedCouleurs(Cadre cadre, List<CadreCouleur> couleurs) {
        for (CadreCouleur couleur : couleurs) {
            if (!couleurRepository.existsByCadreIdAndNomIgnoreCase(cadre.getId(), couleur.getNom())) {
                couleur.setCadre(cadre);
                couleurRepository.save(couleur);
            }
        }
    }

    private CadreCouleur color(String nom, String hex, int ordre) {
        return CadreCouleur.builder().nom(nom).hex(hex).ordre(ordre).build();
    }

    private void seedTarifs(Cadre sans, Cadre large, Cadre amer) {
        Map<String, BigDecimal[]> prices = new LinkedHashMap<>();
        prices.put("30/40", vals(30, null, null));
        prices.put("40/60", vals(null, null, null));
        prices.put("70/50", vals(null, null, null));
        prices.put("80/60", vals(null, null, null));
        prices.put("90/60", vals(90, 150, 170));
        prices.put("100/70", vals(110, 170, 190));
        prices.put("120/80", vals(130, 210, 250));
        prices.put("140/90", vals(160, 250, 290));
        prices.put("160/100", vals(190, 300, 330));

        for (TableauDimension dim : dimensionRepository.findAllByOrderByOrdreAscIdAsc()) {
            BigDecimal[] row = prices.get(dim.getLabel());
            upsert(dim, sans, row != null ? row[0] : null, false);
            upsert(dim, large, row != null ? row[1] : null, false);
            upsert(dim, amer, row != null ? row[2] : null, false);
        }
    }

    private void upsert(TableauDimension dim, Cadre cadre, BigDecimal prix, boolean overwrite) {
        tarifRepository.findByDimensionIdAndCadreId(dim.getId(), cadre.getId())
                .ifPresentOrElse(existing -> {
                    if (overwrite || existing.getPrix() == null && prix != null) {
                        existing.setPrix(prix);
                        tarifRepository.save(existing);
                    }
                }, () -> tarifRepository.save(DimensionCadrePrix.builder()
                        .dimension(dim)
                        .cadre(cadre)
                        .prix(prix)
                        .build()));
    }

    private void assignDimensionsToExistingProducts() {
        List<TableauDimension> priced = dimensionRepository.findAllByOrderByOrdreAscIdAsc().stream()
                .filter(dim -> tarifRepository.findByDimensionId(dim.getId()).stream()
                        .anyMatch(t -> t.getPrix() != null))
                .toList();
        if (priced.isEmpty()) {
            return;
        }
        for (Product product : productRepository.findAll()) {
            if (product.getDimensions() == null || product.getDimensions().isEmpty()) {
                product.setDimensions(new ArrayList<>(priced));
                productRepository.save(product);
            }
        }
    }

    private static BigDecimal[] vals(Integer sans, Integer large, Integer amer) {
        return new BigDecimal[]{
                sans == null ? null : BigDecimal.valueOf(sans),
                large == null ? null : BigDecimal.valueOf(large),
                amer == null ? null : BigDecimal.valueOf(amer)
        };
    }
}
