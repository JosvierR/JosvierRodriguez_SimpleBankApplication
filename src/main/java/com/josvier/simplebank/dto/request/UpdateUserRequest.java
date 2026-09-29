package com.josvier.simplebank.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Replacement name and email for an existing customer.
 * The id and creation time are not part of this body.
 */
public record UpdateUserRequest(
        @NotBlank(message = "Name is required")
        @Schema(description = "Customer name", example = "Customer One Updated")
        String name,

        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        @Schema(description = "Unique email", example = "customer1.updated@example.com")
        String email
) {
}
