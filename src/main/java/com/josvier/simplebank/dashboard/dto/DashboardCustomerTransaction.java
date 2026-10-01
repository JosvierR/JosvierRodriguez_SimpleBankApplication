package com.josvier.simplebank.dashboard.dto;

import com.josvier.simplebank.model.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record DashboardCustomerTransaction(
        TransactionType type,
        String accountSuffix,
        BigDecimal amount,
        LocalDateTime createdAt
) {
}
