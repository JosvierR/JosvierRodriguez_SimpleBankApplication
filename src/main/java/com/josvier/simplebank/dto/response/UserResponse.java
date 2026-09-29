package com.josvier.simplebank.dto.response;

import java.time.LocalDateTime;

/**
 * Customer data returned by the API.
 * The domain {@code User} is not exposed directly.
 */
public record UserResponse(
        String id,
        String name,
        String email,
        LocalDateTime createdAt
) {
}
