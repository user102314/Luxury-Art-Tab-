package com.luxart.ecommerce.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(2)
@RequiredArgsConstructor
@Slf4j
public class ProductPricingSchemaPatcher implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        // Garder les colonnes pour l'ancienne API encore en production.
        // Le nouveau modèle n'écrit plus dedans ; le prix vient de dimension_cadre_prix.
        ensureNullableColumn("prix", "numeric(10,2)");
        ensureNullableColumn("stock", "integer");
        ensureCadreCouleurImageColumn();
    }

    private void ensureCadreCouleurImageColumn() {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*) FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'cadre_couleurs' AND column_name = 'image_url'
                """,
                Integer.class);
        if (count != null && count > 0) {
            return;
        }
        try {
            jdbcTemplate.execute("ALTER TABLE cadre_couleurs ADD COLUMN image_url varchar(500)");
            log.info("Colonne cadre_couleurs.image_url ajoutée");
        } catch (Exception e) {
            log.debug("cadre_couleurs.image_url: {}", e.getMessage());
        }
    }

    private void ensureNullableColumn(String column, String sqlType) {
        if (!columnExists(column)) {
            try {
                jdbcTemplate.execute("ALTER TABLE products ADD COLUMN " + column + " " + sqlType);
                log.info("Colonne products.{} rétablie (compatibilité API actuelle)", column);
            } catch (Exception e) {
                log.warn("Impossible d'ajouter products.{}: {}", column, e.getMessage());
                return;
            }
        }
        try {
            jdbcTemplate.execute("ALTER TABLE products ALTER COLUMN " + column + " DROP NOT NULL");
        } catch (Exception e) {
            log.debug("DROP NOT NULL products.{}: {}", column, e.getMessage());
        }
    }

    private boolean columnExists(String column) {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*) FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'products' AND column_name = ?
                """,
                Integer.class,
                column);
        return count != null && count > 0;
    }
}
