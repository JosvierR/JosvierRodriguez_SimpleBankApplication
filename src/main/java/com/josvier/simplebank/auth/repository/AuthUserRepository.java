package com.josvier.simplebank.auth.repository;

import com.josvier.simplebank.auth.model.AuthUser;

import java.util.Optional;
import java.util.List;
import com.josvier.simplebank.auth.model.AuthRole;

/**
 * Storage port for API logins. Authentication services depend on this interface,
 * not on a Spring Data repository.
 */
public interface AuthUserRepository {

    AuthUser save(AuthUser user);

    Optional<AuthUser> findByUsername(String username);

    Optional<AuthUser> findByEmail(String email);

    Optional<AuthUser> findById(String id);

    Optional<AuthUser> findByBankUserId(String bankUserId);

    List<AuthUser> findAll();

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByBankUserId(String bankUserId);

    long countEnabledByRole(AuthRole role);
}
