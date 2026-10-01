package com.josvier.simplebank.repository;

import com.josvier.simplebank.model.AuditRecord;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Storage contract for compliance traces.
 *
 * The service decides when a movement is worth recording. This interface only
 * stores and loads those records.
 */
public interface AuditRepository {

    AuditRecord save(AuditRecord audit);

    Optional<AuditRecord> findById(String id);

    List<AuditRecord> findAll();

    List<AuditRecord> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    List<AuditRecord> findByActorAuthUserIdAndCreatedAtBetween(String actorAuthUserId,
                                                               LocalDateTime start,
                                                               LocalDateTime end);
}
