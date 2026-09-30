package com.josvier.simplebank.security.actor;

/**
 * The API login that is calling the bank right now.
 *
 * This is not the bank customer who owns the account. {@code authUserId} is the
 * {@code auth_users} id. {@code username} is the normalized login name.
 */
public record CurrentActor(String authUserId, String username) {
}
