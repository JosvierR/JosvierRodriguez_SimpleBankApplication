package com.josvier.simplebank.repository.mongo.adapter;

import com.josvier.simplebank.exception.DuplicateResourceException;
import com.josvier.simplebank.model.User;
import com.josvier.simplebank.repository.UserRepository;
import com.josvier.simplebank.repository.mongo.document.UserDocument;
import com.josvier.simplebank.repository.mongo.springdata.SpringDataUserMongoRepository;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Persistence adapter for users.
 *
 * Maps the domain user to a Mongo document and back. Banking rules do not
 * live here. The unique email index can still reject a save that won a race
 * against the service check, and that rejection becomes the same application
 * exception the service already uses for a known duplicate.
 */
@Repository
public class MongoUserRepositoryAdapter implements UserRepository {

    private final SpringDataUserMongoRepository users;

    public MongoUserRepositoryAdapter(SpringDataUserMongoRepository users) {
        this.users = users;
    }

    @Override
    public User save(User user) {
        try {
            return toDomain(users.save(toDocument(user)));
        } catch (DuplicateKeyException exception) {
            throw new DuplicateResourceException("User with email " + user.getEmail() + " already exists");
        }
    }

    @Override
    public Optional<User> findById(String id) {
        if (id == null) {
            return Optional.empty();
        }
        return users.findById(id).map(this::toDomain);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        if (email == null) {
            return Optional.empty();
        }
        return users.findByEmail(email).map(this::toDomain);
    }

    @Override
    public List<User> findByNameStartingWithIgnoreCase(String prefix) {
        if (prefix == null || prefix.isBlank()) {
            return List.of();
        }
        return users.findByNameStartingWithIgnoreCase(prefix).stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public List<User> findAll() {
        return users.findAll().stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public long count() {
        return users.count();
    }

    @Override
    public void deleteById(String id) {
        if (id != null) {
            users.deleteById(id);
        }
    }

    private UserDocument toDocument(User user) {
        UserDocument document = new UserDocument();
        document.setId(user.getId());
        document.setName(user.getName());
        document.setEmail(user.getEmail());
        document.setCreatedAt(user.getCreatedAt());
        return document;
    }

    private User toDomain(UserDocument document) {
        User user = new User(document.getName(), document.getEmail(), document.getCreatedAt());
        user.setId(document.getId());
        return user;
    }
}
