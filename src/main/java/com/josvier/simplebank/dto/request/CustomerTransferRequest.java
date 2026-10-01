package com.josvier.simplebank.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;

/**
 * Customer transfer command. The destination is a public account number,
 * never another customer's internal account id.
 */
public record CustomerTransferRequest(
        @NotBlank(message = "Source account id is required")
        String sourceAccountId,

        @NotBlank(message = "Destination account number is required")
        @Pattern(regexp = "\\d{12}", message = "Destination account number must be 12 digits")
        String destinationAccountNumber,

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be at least 0.01")
        @Digits(integer = 12, fraction = 2, message = "Amount must have at most 2 decimal places")
        BigDecimal amount
) {
}
