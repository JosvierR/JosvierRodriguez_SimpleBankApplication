package com.josvier.simplebank.repository.mongo.springdata;

import com.josvier.simplebank.repository.mongo.document.AccountDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

/**
 * Spring Data infrastructure for the {@code accounts} collection.
 *
 * Account rules stay in the service. This interface only loads and stores documents.
 */
public interface SpringDataAccountMongoRepository extends MongoRepository<AccountDocument, String> {
}
