package com.josvier.simplebank.dashboard.dto;

import com.josvier.simplebank.security.audit.SecurityAuditAction;

import java.time.LocalDateTime;

public record DashboardSecurityActivity(
        SecurityAuditAction action,
        String actorUsername,
        String targetUsername,
        LocalDateTime createdAt
) {
}
