package com.josvier.simplebank.auth.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

/**
 * Username and password checked by Spring Security. The password is not stored.
 */
public record LoginRequest(
        @NotBlank(message = "Username is required")
        @Schema(example = "josvier")
        String username,

        @NotBlank(message = "Password is required")
        @Schema(example = "choose-a-long-password")
        String password
) {
    public LoginRequest {
        if (username != null) {
            username = username.trim();
        }
    }
}
