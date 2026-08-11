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
            return;
        }
        int updated = jdbcTemplate.update(
                """
                UPDATE products
                SET ref = 'REF-' || id
                WHERE ref IS NULL OR TRIM(ref) = ''
                """);
        if (updated > 0) {
            log.info("Références produits générées: {}", updated);
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
