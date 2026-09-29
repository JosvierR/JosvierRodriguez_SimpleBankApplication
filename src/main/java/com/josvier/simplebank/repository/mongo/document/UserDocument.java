package com.josvier.simplebank.repository.mongo.document;

import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;

import java.time.LocalDateTime;

/**
 * MongoDB shape of a customer.
 *
 * Kept separate from the domain {@code User} so controllers and services never
 * depend on collection names or indexes. {@link MongoId} is Spring Data's
 * {@code @Id} marker that stores {@code _id} as an ObjectId and exposes it as
 * a hex string.
 */
@Document(collection = "users")
public class UserDocument {

    @MongoId
    private String id;

    private String name;

    /**
     * Database-level uniqueness. Two simultaneous creates can both pass the
     * service check; this index makes the second insert fail.
     */
    @Indexed(unique = true, name = "email_unique_idx")
    private String email;

    private LocalDateTime createdAt;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
