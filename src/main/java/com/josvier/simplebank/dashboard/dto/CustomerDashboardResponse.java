package com.josvier.simplebank.dashboard.dto;

import com.josvier.simplebank.auth.model.AuthRole;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record CustomerDashboardResponse(
        AuthRole role,
        LocalDateTime generatedAt,
        boolean bankUserLinked,
        String displayName,
        BigDecimal totalBalance,
        long accountCount,
        List<DashboardAccountSummary> accounts,
        BigDecimal last30DayDeposits,
        BigDecimal last30DayWithdrawals,
        BigDecimal last30DayTransfersIn,
        BigDecimal last30DayTransfersOut,
        List<DashboardActivityPoint> activitySeries,
        List<DashboardCustomerTransaction> recentTransactions
) implements RoleDashboardResponse {
}
