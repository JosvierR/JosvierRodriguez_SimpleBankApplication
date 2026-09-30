package com.josvier.simplebank.auth.model;

/**
 * Authority stored for an authentication principal.
 *
 * API responses use these names. Spring Security authorities are the same names
 * with a {@code ROLE_} prefix, so a public registration cannot invent an admin grant.
 */
public enum AuthRole {
    USER,
    ADMIN
}
