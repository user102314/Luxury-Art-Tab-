package com.luxart.ecommerce.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

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
        dropLabelOnlyUnique();
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

    private void dropLabelOnlyUnique() {
        try {
            jdbcTemplate.execute("ALTER TABLE tableau_dimensions DROP CONSTRAINT IF EXISTS tableau_dimensions_label_key");
        } catch (Exception e) {
            log.debug("DROP tableau_dimensions_label_key: {}", e.getMessage());
        }
        try {
            var names = jdbcTemplate.queryForList(
                    """
                    SELECT conname FROM pg_constraint c
                    JOIN pg_class t ON c.conrelid = t.oid
                    WHERE t.relname = 'tableau_dimensions' AND c.contype = 'u'
                    """,
                    String.class);
            for (String name : names) {
                if (name != null && name.toLowerCase().contains("label") && !name.toLowerCase().contains("note")) {
                    jdbcTemplate.execute("ALTER TABLE tableau_dimensions DROP CONSTRAINT IF EXISTS \"" + name + "\"");
                    log.info("Contrainte unique label seule supprimée: {}", name);
                }
            }
        } catch (Exception e) {
            log.debug("Recherche contraintes label: {}", e.getMessage());
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
