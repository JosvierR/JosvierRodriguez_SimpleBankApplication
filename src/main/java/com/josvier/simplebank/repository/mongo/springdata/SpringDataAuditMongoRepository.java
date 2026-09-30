package com.josvier.simplebank.repository.mongo.springdata;

import com.josvier.simplebank.repository.mongo.document.AuditDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

/**
 * Spring Data infrastructure for the {@code audits} collection.
 *
 * Results come back oldest first so a trace reads in the order the movements happened.
 */
public interface SpringDataAuditMongoRepository extends MongoRepository<AuditDocument, String> {

    List<AuditDocument> findAllByOrderByCreatedAtAsc();
}
