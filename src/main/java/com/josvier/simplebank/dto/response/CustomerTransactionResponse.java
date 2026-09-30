package com.josvier.simplebank.dto.response;

import com.josvier.simplebank.model.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CustomerTransactionResponse(
        String transactionId,
        String accountId,
        TransactionType type,
        BigDecimal amount,
        LocalDateTime createdAt
) {
}
