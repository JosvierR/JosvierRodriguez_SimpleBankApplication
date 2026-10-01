package com.josvier.simplebank.dashboard.dto;

import com.josvier.simplebank.model.AuditAction;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record DashboardBankingActivity(
        AuditAction action,
        String customerName,
        String actorUsername,
        List<String> accountSuffixes,
        BigDecimal amount,
        LocalDateTime createdAt
) {
}
