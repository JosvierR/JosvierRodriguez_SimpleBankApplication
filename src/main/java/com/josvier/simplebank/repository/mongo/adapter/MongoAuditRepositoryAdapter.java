package com.josvier.simplebank.repository.mongo.adapter;

import com.josvier.simplebank.model.AuditRecord;
import com.josvier.simplebank.repository.AuditRepository;
import com.josvier.simplebank.repository.mongo.document.AuditDocument;
import com.josvier.simplebank.repository.mongo.springdata.SpringDataAuditMongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
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

    @Override
    public List<AuditRecord> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end) {
        if (start == null || end == null) {
            return List.of();
        }
        return audits.findByCreatedAtBetweenOrderByCreatedAtAscIdAsc(start, end).stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public List<AuditRecord> findByActorAuthUserIdAndCreatedAtBetween(String actorAuthUserId,
                                                                      LocalDateTime start,
                                                                      LocalDateTime end) {
        if (actorAuthUserId == null || start == null || end == null) {
            return List.of();
        }
        return audits.findByActorAuthUserIdAndCreatedAtBetweenOrderByCreatedAtAscIdAsc(actorAuthUserId, start, end).stream()
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
        document.setActorAuthUserId(audit.getActorAuthUserId());
        document.setActorUsername(audit.getActorUsername());
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
                document.getCreatedAt(),
                document.getActorAuthUserId(),
                document.getActorUsername()
        );
        audit.setId(document.getId());
        return audit;
    }
}
