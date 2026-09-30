package com.josvier.simplebank.auth.dto.request;

import com.josvier.simplebank.auth.validation.MaxUtf8Bytes;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Public registration body.
 *
 * Roles are intentionally absent. Every successful call becomes {@code USER}.
 */
public record RegisterRequest(
        @NotBlank(message = "Username is required")
        @Schema(example = "josvier")
        String username,

        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        @Schema(example = "josvier@example.com")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 8, message = "Password must be at least 8 characters")
        @MaxUtf8Bytes(72)
        @Schema(example = "choose-a-long-password")
        String password
) {
}
