package com.josvier.simplebank.auth;

/**
 * Shared wording for the BCrypt byte limit. The password itself is never included.
 */
public final class PasswordPolicyMessage {

    public static final String TOO_LONG = "Password must not exceed 72 UTF-8 bytes";

    private PasswordPolicyMessage() {
    }
}
