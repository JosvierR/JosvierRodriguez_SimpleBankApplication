package com.josvier.simplebank.auth.repository.mongo.document;

import com.josvier.simplebank.auth.model.AuthRole;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.FieldType;
import org.springframework.data.mongodb.core.mapping.MongoId;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;
import java.util.Set;

/**
 * MongoDB shape of an API login.
 *
 * Stored in {@code auth_users}, separate from bank customers in {@code users}.
 * The password field holds a BCrypt hash, never the password the client sent.
 */
@Document(collection = "auth_users")
public class AuthUserDocument {

    @MongoId(FieldType.OBJECT_ID)
    private String id;

    @Indexed(unique = true, name = "auth_username_unique_idx")
    private String username;

    @Indexed(unique = true, name = "auth_email_unique_idx")
    private String email;

    private String passwordHash;

    private Set<AuthRole> roles;

    private boolean enabled;

    @Indexed(unique = true, name = "auth_bank_user_unique_idx",
            partialFilter = "{'bankUserId': {'$type': 'objectId'}}")
    @Field(targetType = FieldType.OBJECT_ID)
    private String bankUserId;

    private LocalDateTime createdAt;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public Set<AuthRole> getRoles() {
        return roles;
    }

    public void setRoles(Set<AuthRole> roles) {
        this.roles = roles;
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

    public void setBankUserId(String bankUserId) {
        this.bankUserId = bankUserId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
