package com.josvier.simplebank.auth.dto.response;

import java.time.LocalDateTime;

public record AdminAuthUserResponse(
        String id,
        String username,
        String email,
        String role,
        String bankUserId,
        String bankUserName,
        boolean enabled,
        LocalDateTime createdAt
) {
}
