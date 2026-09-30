package com.josvier.simplebank.security.actor;

import com.josvier.simplebank.auth.model.AuthRole;

/**
 * The API login that is calling the bank right now.
 *
 * This is not the bank customer who owns the account. {@code authUserId} is the
 * {@code auth_users} id. {@code username} is the normalized login name.
 */
public record CurrentActor(String authUserId, String username, AuthRole primaryRole, String bankUserId) {

    /** Keeps original banking unit fixtures authoritative as an administrator. */
    public CurrentActor(String authUserId, String username) {
        this(authUserId, username, AuthRole.ADMIN, null);
    }
}
