package com.luxart.ecommerce.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(0)
@RequiredArgsConstructor
@Slf4j
public class OrderSchemaPatcher implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        ensureCanal();
        ensureBooleanColumn("stock_deduit", false);
        ensureBooleanColumn("fidelite_comptabilisee", false);
        ensureOptionalVarcharColumn("reference_instagram");
        ensureOptionalVarcharColumn("reference_whatsapp");
        ensureOptionalVarcharColumn("numero_colis");
        ensureOptionalVarcharColumn("colissimo_code_barre");
        ensureOptionalVarcharColumn("colissimo_reference");
        ensureOptionalVarcharColumn("colissimo_etat");
        ensureOptionalVarcharColumn("colissimo_designation");
        ensureOptionalTimestampColumn("colissimo_imported_at");
        ensureUniqueIndex("colissimo_code_barre");
        ensureCanalAllowsExtraChannels();
    }

    private void ensureCanal() {
        if (!columnExists("canal")) {
            jdbcTemplate.execute("ALTER TABLE orders ADD COLUMN canal varchar(255)");
            log.info("Colonne orders.canal ajoutée");
        }
        int updated = jdbcTemplate.update("UPDATE orders SET canal = 'SITE_WEB' WHERE canal IS NULL");
        if (updated > 0) {
            log.info("Commandes mises à jour (canal): {}", updated);
        }
        setNotNull("canal");
    }

    private void ensureOptionalVarcharColumn(String column) {
        if (!columnExists(column)) {
            jdbcTemplate.execute("ALTER TABLE orders ADD COLUMN " + column + " varchar(255)");
            log.info("Colonne orders.{} ajoutée", column);
        }
    }

    private void ensureOptionalTimestampColumn(String column) {
        if (!columnExists(column)) {
            jdbcTemplate.execute("ALTER TABLE orders ADD COLUMN " + column + " timestamp");
            log.info("Colonne orders.{} ajoutée", column);
        }
    }

    private void ensureUniqueIndex(String column) {
        if (!columnExists(column)) {
            return;
        }
        try {
            jdbcTemplate.execute(
                    "CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_" + column + " ON orders (" + column + ") WHERE " + column + " IS NOT NULL");
            log.info("Index unique orders.{} vérifié", column);
        } catch (Exception e) {
            log.debug("Index unique orders.{} : {}", column, e.getMessage());
        }
    }

    /** Étend le CHECK canal pour accepter INSTAGRAM + WHATSAPP (PostgreSQL / Supabase). */
    private void ensureCanalAllowsExtraChannels() {
        try {
            jdbcTemplate.execute("ALTER TABLE orders DROP CONSTRAINT IF EXISTS chk_orders_canal");
            jdbcTemplate.execute("""
                    ALTER TABLE orders
                      ADD CONSTRAINT chk_orders_canal
                      CHECK (canal IN ('SITE_WEB', 'FACEBOOK', 'INSTAGRAM', 'WHATSAPP'))
                    """);
            log.info("Contrainte chk_orders_canal mise à jour (SITE_WEB|FACEBOOK|INSTAGRAM|WHATSAPP)");
        } catch (Exception e) {
            log.debug("Mise à jour chk_orders_canal : {}", e.getMessage());
        }
    }

    private void ensureBooleanColumn(String column, boolean defaultValue) {
        if (!columnExists(column)) {
            jdbcTemplate.execute("ALTER TABLE orders ADD COLUMN " + column + " boolean");
            log.info("Colonne orders.{} ajoutée", column);
        }
        int updated = jdbcTemplate.update(
                "UPDATE orders SET " + column + " = ? WHERE " + column + " IS NULL",
                defaultValue);
        if (updated > 0) {
            log.info("Commandes mises à jour ({}): {}", column, updated);
        }
        setNotNull(column);
    }

    private void setNotNull(String column) {
        try {
            jdbcTemplate.execute("ALTER TABLE orders ALTER COLUMN " + column + " SET NOT NULL");
        } catch (Exception e) {
            log.debug("Contrainte NOT NULL sur orders.{} : {}", column, e.getMessage());
        }
    }

    private boolean columnExists(String column) {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*) FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = ?
                """,
                Integer.class,
                column);
        return count != null && count > 0;
    }
}
