package com.josvier.simplebank.security.audit;

public enum SecurityAuditAction {
    ROLE_CHANGED,
    AUTH_USER_ENABLED,
    AUTH_USER_DISABLED,
    CUSTOMER_LINKED,
    CUSTOMER_UNLINKED,
    ADMIN_BOOTSTRAPPED
}
