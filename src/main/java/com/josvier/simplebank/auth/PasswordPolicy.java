package com.josvier.simplebank.auth;

import com.josvier.simplebank.auth.exception.PasswordTooLongException;

import java.nio.charset.StandardCharsets;

/**
 * BCrypt only uses the first 72 UTF-8 bytes. A longer password must be rejected
 * instead of being stored as a hash of a truncated value.
 */
public final class PasswordPolicy {

    public static final int MAX_UTF8_BYTES = 72;

    private PasswordPolicy() {
    }

    public static void requireWithinLimit(String password) {
        if (exceedsUtf8Limit(password)) {
            throw new PasswordTooLongException();
        }
    }

    public static boolean exceedsUtf8Limit(String password) {
        return password != null && password.getBytes(StandardCharsets.UTF_8).length > MAX_UTF8_BYTES;
    }
}
