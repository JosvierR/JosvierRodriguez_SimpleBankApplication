package com.josvier.simplebank.auth.model;

import java.time.LocalDateTime;
import java.util.Set;

/**
 * Login principal for the API.
 *
 * This is not a bank customer. Customers stay in the {@code users} collection and
 * keep their own id, name, and email. An {@code AuthUser} only decides who may call
 * the API. The two records are not required to share an id.
 */
public class AuthUser {

    private String id;
    private String username;
    private String email;
    private String passwordHash;
    private final Set<AuthRole> roles;
    private final boolean enabled;
    private final LocalDateTime createdAt;

    public AuthUser(String username, String email, String passwordHash, Set<AuthRole> roles,
                    boolean enabled, LocalDateTime createdAt) {
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
        this.roles = Set.copyOf(roles);
        this.enabled = enabled;
        this.createdAt = createdAt;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public String getEmail() {
        return email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public Set<AuthRole> getRoles() {
        return roles;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    /**
     * Omits the password hash so a log of this object cannot leak credentials.
     */
    @Override
    public String toString() {
        return "AuthUser{id='" + id + "', username='" + username + "', email='" + email
                + "', roles=" + roles + ", enabled=" + enabled + "}";
    }
}
