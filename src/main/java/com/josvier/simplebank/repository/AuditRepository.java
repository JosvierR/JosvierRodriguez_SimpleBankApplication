package com.josvier.simplebank.repository;

import com.josvier.simplebank.model.AuditRecord;

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
}
