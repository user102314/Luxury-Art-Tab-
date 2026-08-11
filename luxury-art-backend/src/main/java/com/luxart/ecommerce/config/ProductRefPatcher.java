package com.luxart.ecommerce.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(1)
@RequiredArgsConstructor
@Slf4j
public class ProductRefPatcher implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        if (!columnExists("ref")) {
            jdbcTemplate.execute("ALTER TABLE products ADD COLUMN ref varchar(100)");
            log.info("Colonne products.ref ajoutée");
        }

        // Migrer l'ancien champ nom → ref si besoin
        if (columnExists("nom")) {
            int fromNom = jdbcTemplate.update(
                    """
                    UPDATE products
                    SET ref = nom
                    WHERE (ref IS NULL OR TRIM(ref) = '')
                      AND nom IS NOT NULL AND TRIM(nom) <> ''
                    """);
            if (fromNom > 0) {
                log.info("Références migrées depuis nom: {}", fromNom);
            }
        }

        int generated = jdbcTemplate.update(
                """
                UPDATE products
                SET ref = 'REF-' || id
                WHERE ref IS NULL OR TRIM(ref) = ''
                """);
        if (generated > 0) {
            log.info("Références produits générées: {}", generated);
        }

        try {
            jdbcTemplate.execute("ALTER TABLE products ALTER COLUMN ref SET NOT NULL");
        } catch (Exception e) {
            log.debug("Contrainte NOT NULL sur products.ref: {}", e.getMessage());
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
