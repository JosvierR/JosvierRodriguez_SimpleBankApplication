package com.josvier.simplebank.dashboard.dto;

import com.josvier.simplebank.auth.model.AuthRole;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record ManagerDashboardResponse(
        AuthRole role,
        LocalDateTime generatedAt,
        long customerCount,
        long accountCount,
        BigDecimal totalBankBalance,
        long checkingCount,
        long savingsCount,
        long premiumAccountCount,
        BigDecimal last30DayDepositVolume,
        BigDecimal last30DayWithdrawalVolume,
        BigDecimal last30DayTransferVolume,
        List<DashboardActivityPoint> moneyMovementSeries,
        List<DashboardBankingActivity> recentBankingAudits
) implements RoleDashboardResponse {
}
