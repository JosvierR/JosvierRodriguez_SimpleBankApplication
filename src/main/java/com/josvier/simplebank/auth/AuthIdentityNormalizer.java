package com.josvier.simplebank.auth;

import java.util.Locale;

/**
 * One place that decides how a login name is stored and looked up.
 *
 * Usernames and emails are trimmed, then lowercased with {@link Locale#ROOT}.
 * {@code "  Josvier  "} and {@code "josvier"} are the same login.
 * Passwords are never passed through this class.
 */
public final class AuthIdentityNormalizer {

    private AuthIdentityNormalizer() {
    }

    public static String username(String username) {
        return username.trim().toLowerCase(Locale.ROOT);
    }

    public static String email(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
