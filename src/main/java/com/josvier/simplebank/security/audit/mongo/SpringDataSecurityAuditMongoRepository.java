package com.josvier.simplebank.security.audit.mongo;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface SpringDataSecurityAuditMongoRepository extends MongoRepository<SecurityAuditDocument, String> {
    List<SecurityAuditDocument> findAllByOrderByCreatedAtDescIdDesc();
    List<SecurityAuditDocument> findTop8ByOrderByCreatedAtDescIdDesc();
}
