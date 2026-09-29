package com.josvier.simplebank.repository;

import com.josvier.simplebank.model.User;

import java.util.List;
import java.util.Optional;

/**
 * Storage contract for users.
 *
 * Services depend on this interface, not on MongoDB. The Mongo adapter is
 * the current implementation. Another database can implement the same port
 * without changing the controller or the business rules.
 */
public interface UserRepository {

    User save(User user);

    Optional<User> findById(String id);

    Optional<User> findByEmail(String email);

    List<User> findAll();
}
