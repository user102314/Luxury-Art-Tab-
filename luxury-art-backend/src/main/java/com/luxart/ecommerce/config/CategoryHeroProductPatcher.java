package com.luxart.ecommerce.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Ajoute categories.hero_product_id pour désigner le produit du hero par catégorie.
 */
@Component
@Order(4)
@RequiredArgsConstructor
@Slf4j
public class CategoryHeroProductPatcher implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*) FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'categories' AND column_name = 'hero_product_id'
                """,
                Integer.class);
        if (count != null && count > 0) {
            return;
        }
        try {
            jdbcTemplate.execute("ALTER TABLE categories ADD COLUMN hero_product_id bigint");
            log.info("Colonne categories.hero_product_id ajoutée");
        } catch (Exception e) {
            log.debug("categories.hero_product_id: {}", e.getMessage());
        }
    }
}
