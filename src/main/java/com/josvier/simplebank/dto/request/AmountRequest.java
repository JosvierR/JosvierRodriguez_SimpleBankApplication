package com.josvier.simplebank.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/**
 * Money amount sent by a deposit or withdrawal request.
 *
 * {@code 0.01} is the smallest accepted value, so zero and negative amounts
 * are rejected at the HTTP boundary as well as inside the service.
 */
public record AmountRequest(
        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be at least 0.01")
        BigDecimal amount
) {
}
