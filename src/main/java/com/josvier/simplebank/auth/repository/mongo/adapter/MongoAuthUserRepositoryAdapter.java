package com.josvier.simplebank.auth.repository.mongo.adapter;

import com.josvier.simplebank.auth.model.AuthRole;
import com.josvier.simplebank.auth.model.AuthUser;
import com.josvier.simplebank.auth.repository.AuthUserRepository;
import com.josvier.simplebank.auth.repository.mongo.document.AuthUserDocument;
import com.josvier.simplebank.auth.repository.mongo.springdata.SpringDataAuthUserMongoRepository;
import com.josvier.simplebank.exception.DuplicateResourceException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.Set;

/**
 * Maps an {@link AuthUser} to {@code auth_users} and back.
 *
 * A unique index can still reject a save that won a race against the service
 * check. That rejection becomes the same conflict the service already uses.
 */
@Repository
public class MongoAuthUserRepositoryAdapter implements AuthUserRepository {

    private final SpringDataAuthUserMongoRepository authUsers;

    public MongoAuthUserRepositoryAdapter(SpringDataAuthUserMongoRepository authUsers) {
        this.authUsers = authUsers;
    }

    @Override
    public AuthUser save(AuthUser user) {
        try {
            return toDomain(authUsers.save(toDocument(user)));
        } catch (DuplicateKeyException exception) {
            throw new DuplicateResourceException("Username or email is already registered");
        }
    }

    @Override
    public Optional<AuthUser> findByUsername(String username) {
        if (username == null) {
            return Optional.empty();
        }
        return authUsers.findByUsername(username).map(this::toDomain);
    }

    @Override
    public Optional<AuthUser> findByEmail(String email) {
        if (email == null) {
            return Optional.empty();
        }
        return authUsers.findByEmail(email).map(this::toDomain);
    }

    @Override
    public boolean existsByUsername(String username) {
        return username != null && authUsers.existsByUsername(username);
    }

    @Override
    public boolean existsByEmail(String email) {
        return email != null && authUsers.existsByEmail(email);
    }

    private AuthUserDocument toDocument(AuthUser user) {
        AuthUserDocument document = new AuthUserDocument();
        document.setId(user.getId());
        document.setUsername(user.getUsername());
        document.setEmail(user.getEmail());
        document.setPasswordHash(user.getPasswordHash());
        document.setRoles(user.getRoles() == null ? Set.of() : Set.copyOf(user.getRoles()));
        document.setEnabled(user.isEnabled());
        document.setCreatedAt(user.getCreatedAt());
        return document;
    }

    private AuthUser toDomain(AuthUserDocument document) {
        Set<AuthRole> roles = document.getRoles() == null ? Set.of() : Set.copyOf(document.getRoles());
        AuthUser user = new AuthUser(
                document.getUsername(),
                document.getEmail(),
                document.getPasswordHash(),
                roles,
                document.isEnabled(),
                document.getCreatedAt()
        );
        user.setId(document.getId());
        return user;
    }
}
