package com.josvier.simplebank.repository.mongo.springdata;

import com.josvier.simplebank.repository.mongo.document.UserDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data infrastructure for the {@code users} collection.
 *
 * This is not the repository the services depend on. The adapter calls it
 * and translates documents into domain users.
 */
public interface SpringDataUserMongoRepository extends MongoRepository<UserDocument, String> {

    Optional<UserDocument> findByEmail(String email);

    List<UserDocument> findByNameStartingWithIgnoreCase(String name);
}
