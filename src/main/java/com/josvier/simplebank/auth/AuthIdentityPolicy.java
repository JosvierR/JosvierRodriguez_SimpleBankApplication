package com.josvier.simplebank.auth;

import com.josvier.simplebank.auth.model.AuthRole;
import com.josvier.simplebank.exception.ResourceConflictException;

/**
 * Reserved-identity rules for public registration and role changes.
 *
 * The username {@code admin} is reserved after the same trim-and-lowercase
 * normalization used everywhere else. No default password is created for it.
 */
public final class AuthIdentityPolicy {

    public static final String RESERVED_ADMIN_USERNAME = "admin";
    public static final String RESERVED_USERNAME_MESSAGE = "This username is reserved";

    private AuthIdentityPolicy() {
    }

    public static boolean isReservedAdminUsername(String username) {
        if (username == null) {
            return false;
        }
        return RESERVED_ADMIN_USERNAME.equals(AuthIdentityNormalizer.username(username));
    }

    public static void requirePublicRegistrationAllowed(String username) {
        if (isReservedAdminUsername(username)) {
            throw new ResourceConflictException(RESERVED_USERNAME_MESSAGE);
        }
    }

    public static void requireRoleCompatible(String username, AuthRole role) {
        if (isReservedAdminUsername(username) && role != AuthRole.ADMIN) {
            throw new ResourceConflictException(RESERVED_USERNAME_MESSAGE);
        }
    }
}
