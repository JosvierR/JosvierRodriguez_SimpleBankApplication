package com.josvier.simplebank.dto.response;

import java.math.BigDecimal;

/**
 * Confirmation shown before a customer submits an internal transfer.
 * It does not include the destination account id or its history.
 */
public record TransferPreviewResponse(
        String sourceAccountNumberMasked,
        BigDecimal sourceBalance,
        String destinationAccountNumberMasked,
        String destinationDisplayName,
        BigDecimal amount,
        boolean ownTransfer
) {
}
