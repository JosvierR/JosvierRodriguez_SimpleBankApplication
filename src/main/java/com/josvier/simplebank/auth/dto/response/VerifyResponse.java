package com.josvier.simplebank.auth.dto.response;

import java.util.List;

/**
 * Identity taken from the current security context after a bearer token is accepted.
 */
public record VerifyResponse(
        String username,
        List<String> roles
) {
}
