package com.josvier.simplebank.dto.response;

import com.josvier.simplebank.model.AccountType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Account data returned by the API, including the owner's name.
 * Balance stays a {@link BigDecimal} so the JSON value is a decimal amount.
 */
public record AccountResponse(
        String accountId,
        String userId,
        String userName,
        AccountType accountType,
        BigDecimal balance,
        LocalDateTime createdAt
) {
}
