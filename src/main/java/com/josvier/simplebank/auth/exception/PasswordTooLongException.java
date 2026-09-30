package com.josvier.simplebank.auth.exception;

import com.josvier.simplebank.auth.PasswordPolicyMessage;

/**
 * The password's UTF-8 form is longer than BCrypt can use.
 */
public class PasswordTooLongException extends RuntimeException {

    public PasswordTooLongException() {
        super(PasswordPolicyMessage.TOO_LONG);
    }
}
