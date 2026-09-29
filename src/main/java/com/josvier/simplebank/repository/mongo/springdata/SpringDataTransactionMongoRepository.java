package com.josvier.simplebank.repository.mongo.springdata;

import com.josvier.simplebank.repository.mongo.document.TransactionDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

/**
 * Spring Data infrastructure for the {@code transactions} collection.
 *
 * Ordering is part of the query so history does not depend on Map iteration
 * order. {@code id} is the tie-breaker when two writes share a timestamp.
 */
public interface SpringDataTransactionMongoRepository extends MongoRepository<TransactionDocument, String> {

    List<TransactionDocument> findByAccountIdOrderByCreatedAtAscIdAsc(String accountId);
}
