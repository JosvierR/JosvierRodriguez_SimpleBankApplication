package com.josvier.simplebank.dashboard.dto;

import com.josvier.simplebank.auth.model.AuthRole;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record TellerDashboardResponse(
        AuthRole role,
        LocalDateTime generatedAt,
        String username,
        long customerCount,
        long accountCount,
        long newAccountsToday,
        long myOperationsToday,
        BigDecimal myDepositsTodayAmount,
        BigDecimal myWithdrawalsTodayAmount,
        List<DashboardBankingActivity> myRecentOperations
) implements RoleDashboardResponse {
}
