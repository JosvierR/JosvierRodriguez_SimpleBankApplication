package com.josvier.simplebank.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CustomerTransferResponse(
        String fromAccountId,
        String toAccountId,
        BigDecimal amount,
        BigDecimal fromBalance,
        BigDecimal toBalance,
        LocalDateTime createdAt
) {
}
