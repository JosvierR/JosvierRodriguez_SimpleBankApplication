package com.josvier.simplebank.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Receipt returned after a customer internal transfer commits.
 */
public record CustomerTransferReceiptResponse(
        String transferReference,
        BigDecimal amount,
        String sourceAccountNumberMasked,
        String destinationAccountNumberMasked,
        String destinationDisplayName,
        BigDecimal sourceBalance,
        LocalDateTime createdAt
) {
}
