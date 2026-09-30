package com.josvier.simplebank.dto.response;

import java.time.LocalDateTime;

/**
 * Error body returned for every handled API failure.
 * It describes what went wrong without including a stack trace.
 */
public record ErrorResponse(
        LocalDateTime timestamp,
        int status,
        String error,
        String message,
        String path,
        String code
) {
}
