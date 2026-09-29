package com.josvier.simplebank.dto.request;

import com.josvier.simplebank.model.AccountType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

/**
 * Data required to open an account for an existing user.
 */
public record CreateAccountRequest(
        @NotNull(message = "User id is required")
        @Schema(description = "Id returned by POST /api/users", example = "68dc1234567890abcdef1234")
        String userId,

        @NotNull(message = "Account type is required")
        @Schema(description = "CHECKING or SAVINGS", example = "CHECKING")
        AccountType accountType
) {
}
