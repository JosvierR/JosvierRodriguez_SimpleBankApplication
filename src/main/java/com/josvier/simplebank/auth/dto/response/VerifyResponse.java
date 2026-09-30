package com.josvier.simplebank.auth.dto.response;

import java.util.List;

/**
 * Identity taken from the current security context after a bearer token is accepted.
 */
public record VerifyResponse(
        String username,
        String primaryRole,
        boolean bankUserLinked,
        List<String> roles
) {
}
