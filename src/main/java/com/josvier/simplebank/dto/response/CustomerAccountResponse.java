package com.josvier.simplebank.dto.response;

import com.josvier.simplebank.model.AccountType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CustomerAccountResponse(
        String accountId,
        AccountType accountType,
        BigDecimal balance,
        LocalDateTime createdAt,
        String accountNumber
) {
}
