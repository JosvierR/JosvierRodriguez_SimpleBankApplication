package com.josvier.simplebank.auth.dto.response;

import java.util.List;

/**
 * Access token returned by register and login.
 *
 * {@code expiresIn} is seconds. The password and its hash are never included.
 */
public record AuthResponse(
        String token,
        String tokenType,
        long expiresIn,
        String username,
        List<String> roles
) {
}
