package com.josvier.simplebank.dto.response;

import com.josvier.simplebank.model.AuditAction;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Compliance view of one successful money movement.
 *
 * {@code userId} and {@code userName} are the bank customer. {@code actorAuthUserId}
 * and {@code actorUsername} are the API login that executed the call. Audits written
 * before JWT leave the actor fields null.
 */
public record AuditResponse(
        String id,
        AuditAction action,
        @Schema(description = "Bank customer id. This is not the API login id.")
        String userId,
        @Schema(description = "Bank customer name.")
        String userName,
        List<String> accountIds,
        List<String> involvedUserIds,
        BigDecimal amount,
        List<String> transactionIds,
        LocalDateTime createdAt,
        @Schema(description = "auth_users id of the API caller. Null on audits written before JWT.")
        String actorAuthUserId,
        @Schema(description = "Normalized username of the API caller. Null on audits written before JWT.")
        String actorUsername
) {
}
