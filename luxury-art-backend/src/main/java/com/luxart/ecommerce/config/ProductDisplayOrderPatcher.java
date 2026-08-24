package com.luxart.ecommerce.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Ajoute / initialise products.display_order de façon sûre
 * (évite ALTER … NOT NULL qui échoue si des lignes existent déjà).
 */
@Component
@Order(2)
@RequiredArgsConstructor
@Slf4j
public class ProductDisplayOrderPatcher implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*) FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'display_order'
                """,
                Integer.class);
        if (count == null || count == 0) {
            jdbcTemplate.execute("ALTER TABLE products ADD COLUMN display_order integer DEFAULT 0");
            log.info("Colonne products.display_order ajoutée (DEFAULT 0)");
        }

        int filled = jdbcTemplate.update("UPDATE products SET display_order = 0 WHERE display_order IS NULL");
        if (filled > 0) {
            log.info("display_order initialisé pour {} produits", filled);
        }
    }
}
