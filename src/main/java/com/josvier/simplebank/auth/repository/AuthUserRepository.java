package com.josvier.simplebank.auth.repository;

import com.josvier.simplebank.auth.model.AuthUser;

import java.util.Optional;

/**
 * Storage port for API logins. Authentication services depend on this interface,
 * not on a Spring Data repository.
 */
public interface AuthUserRepository {

    AuthUser save(AuthUser user);

    Optional<AuthUser> findByUsername(String username);

    Optional<AuthUser> findByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);
}
