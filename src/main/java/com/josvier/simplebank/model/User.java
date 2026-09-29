package com.josvier.simplebank.model;

import java.time.LocalDateTime;

/**
 * A bank customer.
 *
 * This is an internal domain object. The API returns {@code UserResponse}
 * instead, so callers cannot change a stored user through the HTTP contract.
 */
public class User {

    private String id;
    private final String name;
    private final String email;
    private final LocalDateTime createdAt;

    public User(String name, String email, LocalDateTime createdAt) {
        this.name = name;
        this.email = email;
        this.createdAt = createdAt;
    }

    /**
     * Assigned by MongoDB as an ObjectId hex string when the user is stored.
     */
    public void setId(String id) {
        this.id = id;
    }

    /**
     * Returns a separate instance with the same values.
     * Repositories store and return copies so later field changes cannot
     * silently rewrite the record that is already in memory.
     */
    public User copy() {
        User copy = new User(name, email, createdAt);
        copy.setId(id);
        return copy;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
