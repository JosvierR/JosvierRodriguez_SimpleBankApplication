package com.josvier.simplebank.auth.dto.response;

import com.josvier.simplebank.security.audit.SecurityAuditAction;

import java.time.LocalDateTime;

public record SecurityAuditResponse(
        String id,
        String actorUsername,
        String targetAuthUserId,
        SecurityAuditAction action,
        String previousValue,
        String newValue,
        LocalDateTime createdAt
) {
}
