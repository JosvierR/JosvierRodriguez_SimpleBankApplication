package com.josvier.simplebank.dto.request;

import com.josvier.simplebank.model.AccountType;
import jakarta.validation.constraints.NotNull;

/**
 * Data required to open an account for an existing user.
 */
public record CreateAccountRequest(
        @NotNull(message = "User id is required")
        Long userId,

        @NotNull(message = "Account type is required")
        AccountType accountType
) {
}
