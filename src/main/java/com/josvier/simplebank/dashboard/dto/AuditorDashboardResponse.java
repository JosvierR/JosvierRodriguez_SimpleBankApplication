package com.josvier.simplebank.dashboard.dto;

import com.josvier.simplebank.auth.model.AuthRole;

import java.time.LocalDateTime;
import java.util.List;

public record AuditorDashboardResponse(
        AuthRole role,
        LocalDateTime generatedAt,
        long customerCount,
        long accountCount,
        long auditRecordsLast30Days,
        long distinctActorsLast30Days,
        long depositAuditCount,
        long withdrawAuditCount,
        long transferAuditCount,
        List<DashboardBankingActivity> recentBankingAudits
) implements RoleDashboardResponse {
}
