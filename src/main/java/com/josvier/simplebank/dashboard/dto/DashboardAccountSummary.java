package com.josvier.simplebank.dashboard.dto;

import com.josvier.simplebank.model.AccountType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record DashboardAccountSummary(
        String accountId,
        AccountType accountType,
        BigDecimal balance,
        LocalDateTime createdAt,
        String accountNumber
) {
}
