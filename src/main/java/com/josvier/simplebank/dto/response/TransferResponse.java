package com.josvier.simplebank.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Result of a transfer: both balances after the move, and the audit row that traces it.
 */
public record TransferResponse(
        String fromAccountId,
        String toAccountId,
        BigDecimal amount,
        BigDecimal fromBalance,
        BigDecimal toBalance,
        String auditId,
        LocalDateTime createdAt
) {
}
