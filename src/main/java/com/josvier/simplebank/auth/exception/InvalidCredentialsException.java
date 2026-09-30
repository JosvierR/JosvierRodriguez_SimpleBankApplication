package com.josvier.simplebank.auth.exception;

/**
 * Login failed. The message shown to the client does not say whether the
 * username or the password was wrong.
 */
public class InvalidCredentialsException extends RuntimeException {

    public InvalidCredentialsException() {
        super("Invalid username or password");
    }
}
