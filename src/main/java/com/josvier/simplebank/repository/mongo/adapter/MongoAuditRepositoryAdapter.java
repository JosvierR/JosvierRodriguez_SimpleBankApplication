package com.josvier.simplebank.repository.mongo.adapter;

import com.josvier.simplebank.model.AuditRecord;
import com.josvier.simplebank.repository.AuditRepository;
import com.josvier.simplebank.repository.mongo.document.AuditDocument;
import com.josvier.simplebank.repository.mongo.springdata.SpringDataAuditMongoRepository;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Persistence adapter for audit traces.
 *
 * Converts between the domain record and the Mongo document. It does not
 * decide whether a transfer is allowed.
 */
@Repository
public class MongoAuditRepositoryAdapter implements AuditRepository {

    private final SpringDataAuditMongoRepository audits;

    public MongoAuditRepositoryAdapter(SpringDataAuditMongoRepository audits) {
        this.audits = audits;
    }

    @Override
    public AuditRecord save(AuditRecord audit) {
        return toDomain(audits.save(toDocument(audit)));
    }

    @Override
    public Optional<AuditRecord> findById(String id) {
        if (id == null) {
            return Optional.empty();
        }
        return audits.findById(id).map(this::toDomain);
    }

    @Override
    public List<AuditRecord> findAll() {
        return audits.findAllByOrderByCreatedAtAsc().stream()
                .map(this::toDomain)
                .toList();
    }

    private AuditDocument toDocument(AuditRecord audit) {
        AuditDocument document = new AuditDocument();
        document.setId(audit.getId());
        document.setAction(audit.getAction());
        document.setUserId(audit.getUserId());
        document.setAccountIds(new ArrayList<>(audit.getAccountIds()));
        document.setInvolvedUserIds(new ArrayList<>(audit.getInvolvedUserIds()));
        document.setAmount(audit.getAmount());
        document.setTransactionIds(new ArrayList<>(audit.getTransactionIds()));
        document.setCreatedAt(audit.getCreatedAt());
        return document;
    }

    private AuditRecord toDomain(AuditDocument document) {
        AuditRecord audit = new AuditRecord(
                document.getAction(),
                document.getUserId(),
                document.getAccountIds(),
                document.getInvolvedUserIds(),
                document.getAmount(),
                document.getTransactionIds(),
                document.getCreatedAt()
        );
        audit.setId(document.getId());
        return audit;
    }
}
