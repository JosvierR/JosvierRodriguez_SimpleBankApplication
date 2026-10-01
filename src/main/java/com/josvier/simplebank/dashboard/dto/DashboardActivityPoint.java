package com.josvier.simplebank.dashboard.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DashboardActivityPoint(
        LocalDate periodStart,
        BigDecimal deposits,
        BigDecimal withdrawals,
        BigDecimal transfers
) {
}
