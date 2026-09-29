package com.josvier.simplebank.exception;

/**
 * Thrown when a requested user or account does not exist.
 * Mapped to HTTP 404 by {@link GlobalExceptionHandler}.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
