package com.luxart.ecommerce.config;

import com.luxart.ecommerce.model.enums.AdminActionType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.stream.Collectors;

/**
 * Aligne le CHECK PostgreSQL admin_audit_logs.action_type sur l'enum Java
 * (sinon PRODUCT_PRIORITY / CATEGORY_HERO → rollback + 500).
 */
@Component
@Profile("!h2")
@Order(5)
@RequiredArgsConstructor
@Slf4j
public class AdminAuditActionTypePatcher implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        String values = Arrays.stream(AdminActionType.values())
                .map(Enum::name)
                .map(v -> "'" + v + "'")
                .collect(Collectors.joining(", "));
        try {
            jdbcTemplate.execute("ALTER TABLE admin_audit_logs DROP CONSTRAINT IF EXISTS admin_audit_logs_action_type_check");
            jdbcTemplate.execute(
                    "ALTER TABLE admin_audit_logs ADD CONSTRAINT admin_audit_logs_action_type_check "
                            + "CHECK (action_type IN (" + values + "))"
            );
            log.info("Contrainte admin_audit_logs_action_type_check mise à jour ({})", values);
        } catch (Exception e) {
            log.warn("Patch admin_audit_logs.action_type: {}", e.getMessage());
        }
    }
}
