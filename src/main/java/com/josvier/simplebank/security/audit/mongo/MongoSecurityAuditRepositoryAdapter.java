package com.josvier.simplebank.security.audit.mongo;

import com.josvier.simplebank.security.audit.SecurityAudit;
import com.josvier.simplebank.security.audit.SecurityAuditRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class MongoSecurityAuditRepositoryAdapter implements SecurityAuditRepository {
    private final SpringDataSecurityAuditMongoRepository audits;

    public MongoSecurityAuditRepositoryAdapter(SpringDataSecurityAuditMongoRepository audits) {
        this.audits = audits;
    }

    @Override
    public SecurityAudit save(SecurityAudit audit) {
        return toDomain(audits.save(toDocument(audit)));
    }

    @Override
    public List<SecurityAudit> findAll() {
        return audits.findAllByOrderByCreatedAtDescIdDesc().stream().map(this::toDomain).toList();
    }

    @Override
    public List<SecurityAudit> findRecent() {
        return audits.findTop8ByOrderByCreatedAtDescIdDesc().stream().map(this::toDomain).toList();
    }

    private SecurityAuditDocument toDocument(SecurityAudit audit) {
        SecurityAuditDocument document = new SecurityAuditDocument();
        document.setId(audit.getId());
        document.setActorAuthUserId(audit.getActorAuthUserId());
        document.setActorUsername(audit.getActorUsername());
        document.setTargetAuthUserId(audit.getTargetAuthUserId());
        document.setAction(audit.getAction());
        document.setPreviousValue(audit.getPreviousValue());
        document.setNewValue(audit.getNewValue());
        document.setCreatedAt(audit.getCreatedAt());
        return document;
    }

    private SecurityAudit toDomain(SecurityAuditDocument document) {
        SecurityAudit audit = new SecurityAudit(
                document.getActorAuthUserId(), document.getActorUsername(), document.getTargetAuthUserId(),
                document.getAction(), document.getPreviousValue(), document.getNewValue(), document.getCreatedAt());
        audit.setId(document.getId());
        return audit;
    }
}
