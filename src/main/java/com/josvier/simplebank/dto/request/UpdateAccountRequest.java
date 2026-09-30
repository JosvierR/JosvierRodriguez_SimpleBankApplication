package com.josvier.simplebank.dto.request;

import com.josvier.simplebank.model.AccountType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

/**
 * Replacement account type. The owner, balance, id, and creation time are not part of this body.
 */
public record UpdateAccountRequest(
        @NotNull(message = "Account type is required")
        @Schema(description = "CHECKING or SAVINGS", example = "CHECKING")
        AccountType accountType
) {
}
