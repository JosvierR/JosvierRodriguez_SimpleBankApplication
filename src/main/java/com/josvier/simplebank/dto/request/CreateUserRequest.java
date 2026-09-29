package com.josvier.simplebank.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Data required to open a customer profile.
 * Validation annotations reject a blank name or an invalid email before the service runs.
 */
public record CreateUserRequest(
        @NotBlank(message = "Name is required")
        @Schema(description = "Customer name", example = "Josvier Rodriguez")
        String name,

        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        @Schema(description = "Unique email", example = "josvier@example.com")
        String email
) {
}
