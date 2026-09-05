package com.luxart.ecommerce.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Autorise plusieurs dimensions même label si la note diffère (ex. 30/40 et 30/40 note « 3 »).
 */
@Component
@Order(3)
@RequiredArgsConstructor
@Slf4j
public class TableauDimensionSchemaPatcher implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        ensureNoteColumn();
        normalizeNoteValues();
        dropLabelOnlyUniqueConstraints();
        dropLabelOnlyUniqueIndexes();
        ensureLabelNoteUnique();
    }

    private void ensureNoteColumn() {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*) FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'tableau_dimensions' AND column_name = 'note'
                """,
                Integer.class);
        if (count != null && count > 0) {
            return;
        }
        try {
            jdbcTemplate.execute(
                    "ALTER TABLE tableau_dimensions ADD COLUMN note varchar(40) NOT NULL DEFAULT ''");
            log.info("Colonne tableau_dimensions.note ajoutée");
        } catch (Exception e) {
            log.debug("tableau_dimensions.note: {}", e.getMessage());
        }
    }

    private void normalizeNoteValues() {
        try {
            jdbcTemplate.execute("UPDATE tableau_dimensions SET note = '' WHERE note IS NULL");
            jdbcTemplate.execute("ALTER TABLE tableau_dimensions ALTER COLUMN note SET DEFAULT ''");
            jdbcTemplate.execute("ALTER TABLE tableau_dimensions ALTER COLUMN note SET NOT NULL");
        } catch (Exception e) {
            log.debug("Normalisation note tableau_dimensions: {}", e.getMessage());
        }
    }

    private void dropLabelOnlyUniqueConstraints() {
        jdbcTemplate.execute("ALTER TABLE tableau_dimensions DROP CONSTRAINT IF EXISTS tableau_dimensions_label_key");
        jdbcTemplate.execute("ALTER TABLE tableau_dimensions DROP CONSTRAINT IF EXISTS uk_ghhqr0j74cnethmept779kjjc");

        List<Map<String, Object>> constraints = jdbcTemplate.queryForList(
                """
                SELECT c.conname AS name, pg_get_constraintdef(c.oid) AS def
                FROM pg_constraint c
                JOIN pg_class t ON c.conrelid = t.oid
                WHERE t.relname = 'tableau_dimensions' AND c.contype = 'u'
                """);
        for (Map<String, Object> row : constraints) {
            String name = String.valueOf(row.get("name"));
            String def = row.get("def") != null ? String.valueOf(row.get("def")).toLowerCase() : "";
            if ("uk_tableau_dimensions_label_note".equalsIgnoreCase(name)) {
                continue;
            }
            if (def.contains("(label)") && !def.contains("note")) {
                try {
                    jdbcTemplate.execute("ALTER TABLE tableau_dimensions DROP CONSTRAINT IF EXISTS \"" + name + "\"");
                    log.info("Contrainte unique label seule supprimée: {}", name);
                } catch (Exception e) {
                    log.warn("Impossible de supprimer {}: {}", name, e.getMessage());
                }
            }
        }
    }

    private void dropLabelOnlyUniqueIndexes() {
        List<Map<String, Object>> indexes = jdbcTemplate.queryForList(
                """
                SELECT indexname, indexdef
                FROM pg_indexes
                WHERE schemaname = 'public' AND tablename = 'tableau_dimensions'
                """);
        for (Map<String, Object> row : indexes) {
            String name = String.valueOf(row.get("indexname"));
            String def = row.get("indexdef") != null ? String.valueOf(row.get("indexdef")).toLowerCase() : "";
            if ("uk_tableau_dimensions_label_note".equalsIgnoreCase(name)) {
                continue;
            }
            if (def.contains("unique") && def.contains("(label)") && !def.contains("note")) {
                try {
                    jdbcTemplate.execute("DROP INDEX IF EXISTS \"" + name + "\"");
                    log.info("Index unique label seule supprimé: {}", name);
                } catch (Exception e) {
                    log.warn("Impossible de supprimer index {}: {}", name, e.getMessage());
                }
            }
        }
    }

    private void ensureLabelNoteUnique() {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*) FROM pg_indexes
                WHERE schemaname = 'public' AND tablename = 'tableau_dimensions'
                  AND indexname = 'uk_tableau_dimensions_label_note'
                """,
                Integer.class);
        if (count != null && count > 0) {
            return;
        }
        try {
            jdbcTemplate.execute(
                    "CREATE UNIQUE INDEX uk_tableau_dimensions_label_note ON tableau_dimensions (label, note)");
            log.info("Index unique tableau_dimensions (label, note) créé");
        } catch (Exception e) {
            log.warn("Index unique label+note: {}", e.getMessage());
        }
    }
}
