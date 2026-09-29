package com.josvier.simplebank.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Data required to open a customer profile.
 * Validation annotations reject a blank name or an invalid email before the service runs.
 */
public record CreateUserRequest(
        @NotBlank(message = "Name is required")
        String name,

        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        String email
) {
}
