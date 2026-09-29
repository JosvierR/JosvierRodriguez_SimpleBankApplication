package com.josvier.simplebank.dto.response;

import com.josvier.simplebank.model.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * One entry in an account's transaction history.
 */
public record TransactionResponse(
        String transactionId,
        String accountId,
        TransactionType type,
        BigDecimal amount,
        LocalDateTime createdAt
) {
}
