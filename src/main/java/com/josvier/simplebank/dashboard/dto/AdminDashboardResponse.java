package com.josvier.simplebank.dashboard.dto;

import com.josvier.simplebank.auth.model.AuthRole;

import java.time.LocalDateTime;
import java.util.List;

public record AdminDashboardResponse(
        AuthRole role,
        LocalDateTime generatedAt,
        long activeAuthUsers,
        long disabledAuthUsers,
        List<DashboardRoleCount> roleDistribution,
        long linkedCustomerIdentities,
        long unlinkedCustomerIdentities,
        long customerCount,
        long accountCount,
        List<DashboardSecurityActivity> recentSecurityAudits,
        List<DashboardBankingActivity> recentBankingAudits
) implements RoleDashboardResponse {
}
