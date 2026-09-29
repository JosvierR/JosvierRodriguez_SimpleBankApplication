package com.josvier.simplebank.exception;

/**
 * Thrown when a request conflicts with an existing relationship.
 * Mapped to HTTP 409. Duplicate emails use {@link DuplicateResourceException}
 * so the two conflicts stay distinct.
 */
public class ResourceConflictException extends RuntimeException {

    public ResourceConflictException(String message) {
        super(message);
    }
}
