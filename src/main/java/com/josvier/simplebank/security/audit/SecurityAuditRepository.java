package com.josvier.simplebank.security.audit;

import java.util.List;

public interface SecurityAuditRepository {
    SecurityAudit save(SecurityAudit audit);
    List<SecurityAudit> findAll();
}
