package com.josvier.simplebank.model;

import java.time.LocalDateTime;

/**
 * A bank customer.
 *
 * This is an internal domain object. The API returns {@code UserResponse}
 * instead, so callers cannot change a stored user through the HTTP contract.
 * Profile changes go through {@link #updateProfile(String, String)} so the id
 * and creation time stay the values MongoDB already stored.
 */
public class User {

    private String id;
    private String name;
    private String email;
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
     * Replaces the name and email only. The id and {@code createdAt} stay as they are
     * so an update does not become a new customer.
     */
    public void updateProfile(String name, String email) {
        this.name = name;
        this.email = email;
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
