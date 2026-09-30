package com.josvier.simplebank.auth.repository.mongo.springdata;

import com.josvier.simplebank.auth.repository.mongo.document.AuthUserDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

/**
 * Spring Data port for {@code auth_users}. Controllers do not see this type.
 */
public interface SpringDataAuthUserMongoRepository extends MongoRepository<AuthUserDocument, String> {

    Optional<AuthUserDocument> findByUsername(String username);

    Optional<AuthUserDocument> findByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);
}
