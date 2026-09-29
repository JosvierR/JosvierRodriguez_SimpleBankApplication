package com.josvier.simplebank.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/**
 * Money amount sent by a deposit or withdrawal request.
 *
 * The value must be at least {@code 0.01} and may have at most two decimal
 * places. {@code 10.126} is rejected here so the API does not silently round
 * a client amount to {@code 10.13}. Whole numbers such as {@code 10} remain valid.
 */
public record AmountRequest(
        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be at least 0.01")
        @Digits(integer = 12, fraction = 2, message = "Amount must have at most 2 decimal places")
        @Schema(description = "Amount with at most 2 decimal places. Minimum 0.01", example = "25.00")
        BigDecimal amount
) {
}
