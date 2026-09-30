package com.josvier.simplebank.dto.response;

import com.josvier.simplebank.model.AuditAction;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Compliance view of one successful money movement.
 *
 * {@code userId} is who started it. {@code involvedUserIds} includes that person
 * and, for a transfer, the owner of the account that received the money.
 * {@code accountIds} lists every account the movement touched.
 */
public record AuditResponse(
        String id,
        AuditAction action,
        String userId,
        String userName,
        List<String> accountIds,
        List<String> involvedUserIds,
        BigDecimal amount,
        List<String> transactionIds,
        LocalDateTime createdAt
) {
}
