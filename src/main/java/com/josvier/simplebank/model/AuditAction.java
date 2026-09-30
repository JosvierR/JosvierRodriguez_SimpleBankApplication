package com.josvier.simplebank.model;

/**
 * Kind of successful money movement recorded for compliance.
 *
 * A rejected deposit, withdrawal, or transfer must not create an audit row.
 */
public enum AuditAction {
    DEPOSIT,
    WITHDRAW,
    TRANSFER
}
