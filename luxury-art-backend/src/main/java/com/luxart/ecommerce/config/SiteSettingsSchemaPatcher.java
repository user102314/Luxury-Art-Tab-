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
public class SiteSettingsSchemaPatcher implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        ensureColumn("boutique_nom", "varchar(255)");
        ensureColumn("slogan", "varchar(255)");
        ensureColumn("email_contact", "varchar(255)");
        ensureColumn("telephone_contact", "varchar(100)");
        ensureColumn("adresse", "varchar(500)");
        ensureColumn("ville", "varchar(100)");
        ensureColumn("pays", "varchar(100)");
    }

    private void ensureColumn(String column, String type) {
        if (!columnExists(column)) {
            jdbcTemplate.execute("ALTER TABLE site_settings ADD COLUMN " + column + " " + type);
            log.info("Colonne site_settings.{} ajoutée", column);
        }
    }

    private boolean columnExists(String column) {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*) FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'site_settings' AND column_name = ?
                """,
                Integer.class,
                column);
        return count != null && count > 0;
    }
}
