package com.josvier.simplebank.exception;

/**
 * Thrown when a deposit or withdrawal breaks a banking rule,
 * such as a non-positive amount or insufficient funds.
 * Mapped to HTTP 400 by {@link GlobalExceptionHandler}.
 */
public class InvalidTransactionException extends RuntimeException {

    public InvalidTransactionException(String message) {
        super(message);
    }
}
