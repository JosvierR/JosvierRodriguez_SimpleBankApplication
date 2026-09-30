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
    private Set<AuthRole> roles;
    private boolean enabled;
    private String bankUserId;
    private final LocalDateTime createdAt;

    public AuthUser(String username, String email, String passwordHash, Set<AuthRole> roles,
                    boolean enabled, LocalDateTime createdAt) {
        this(username, email, passwordHash, roles, enabled, createdAt, null);
    }

    public AuthUser(String username, String email, String passwordHash, Set<AuthRole> roles,
                    boolean enabled, LocalDateTime createdAt, String bankUserId) {
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
        this.roles = Set.copyOf(roles);
        this.enabled = enabled;
        this.createdAt = createdAt;
        this.bankUserId = bankUserId;
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

    public AuthRole getPrimaryRole() {
        if (roles.contains(AuthRole.ADMIN)) {
            return AuthRole.ADMIN;
        }
        return roles.stream()
                .filter(role -> role != AuthRole.USER)
                .findFirst()
                .orElse(AuthRole.CUSTOMER);
    }

    public void changePrimaryRole(AuthRole role) {
        if (role == null || role == AuthRole.USER) {
            throw new IllegalArgumentException("A current primary role is required");
        }
        this.roles = Set.of(role);
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getBankUserId() {
        return bankUserId;
    }

    public void linkBankUser(String bankUserId) {
        this.bankUserId = bankUserId;
    }

    public void clearBankUserLink() {
        this.bankUserId = null;
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
                + "', roles=" + roles + ", enabled=" + enabled + ", bankUserLinked="
                + (bankUserId != null) + "}";
    }
}
