package com.josvier.simplebank.repository;

import com.josvier.simplebank.model.User;

import java.util.List;
import java.util.Optional;

/**
 * Storage contract for users.
 *
 * Services depend on this interface, not on the in-memory class. A later
 * branch can add a MySQL implementation without changing the controller
 * or the business rules.
 */
public interface UserRepository {

    User save(User user);

    Optional<User> findById(Long id);

    Optional<User> findByEmail(String email);

    List<User> findAll();
}
