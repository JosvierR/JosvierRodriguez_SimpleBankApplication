package com.josvier.simplebank.auth.service;

import com.josvier.simplebank.auth.AuthIdentityNormalizer;
import com.josvier.simplebank.auth.model.AuthRole;
import com.josvier.simplebank.auth.model.AuthUser;
import com.josvier.simplebank.auth.repository.AuthUserRepository;
import com.josvier.simplebank.security.audit.SecurityAudit;
import com.josvier.simplebank.security.audit.SecurityAuditAction;
import com.josvier.simplebank.security.audit.SecurityAuditRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;

@Component
@ConditionalOnProperty(name = "security.bootstrap-admin.enabled", havingValue = "true")
public class AdminBootstrapRunner implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(AdminBootstrapRunner.class);

    private final AuthUserRepository authUsers;
    private final SecurityAuditRepository securityAudits;
    private final String username;
    private final Clock clock;

    public AdminBootstrapRunner(AuthUserRepository authUsers, SecurityAuditRepository securityAudits,
            @Value("${security.bootstrap-admin.username:}") String username, Clock clock) {
        this.authUsers = authUsers;
        this.securityAudits = securityAudits;
        this.username = username;
        this.clock = clock;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (authUsers.countEnabledByRole(AuthRole.ADMIN) > 0) {
            return;
        }
        String normalized = AuthIdentityNormalizer.username(username);
        if (normalized == null || normalized.isBlank()) {
            log.warn("Admin bootstrap was enabled without a username; no identity was changed");
            return;
        }
        AuthUser target = authUsers.findByUsername(normalized).orElse(null);
        if (target == null) {
            log.warn("Admin bootstrap identity was not found; no identity was changed");
            return;
        }
        String previous = target.getPrimaryRole().name();
        target.changePrimaryRole(AuthRole.ADMIN);
        target.clearBankUserLink();
        AuthUser saved = authUsers.save(target);
        securityAudits.save(new SecurityAudit(
                null, "bootstrap", saved.getId(), SecurityAuditAction.ADMIN_BOOTSTRAPPED,
                previous, AuthRole.ADMIN.name(), LocalDateTime.now(clock)));
        log.info("An existing authentication identity was promoted to ADMIN; disable admin bootstrap now");
    }
}
