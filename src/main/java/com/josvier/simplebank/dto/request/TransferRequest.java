package com.josvier.simplebank.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/**
 * Moves money from one existing account to another.
 *
 * The amount follows the same rules as a deposit: at least 0.01 and at most two decimal places.
 */
public record TransferRequest(
        @NotBlank(message = "Source account id is required")
        @Schema(description = "Account that sends the money", example = "68dc1234567890abcdef0002")
        String fromAccountId,

        @NotBlank(message = "Destination account id is required")
        @Schema(description = "Account that receives the money", example = "68dc1234567890abcdef0003")
        String toAccountId,

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be at least 0.01")
        @Digits(integer = 12, fraction = 2, message = "Amount must have at most 2 decimal places")
        @Schema(description = "Amount with at most 2 decimal places. Minimum 0.01", example = "25.00")
        BigDecimal amount
) {
}
