package com.josvier.simplebank.security.actor;

/**
 * Supplies the authenticated API caller without making banking services read
 * {@code SecurityContextHolder} themselves.
 */
public interface CurrentActorProvider {

    CurrentActor current();
}
