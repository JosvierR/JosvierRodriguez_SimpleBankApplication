package com.josvier.simplebank.service;

import com.josvier.simplebank.dto.response.AuditResponse;
import com.josvier.simplebank.model.AuditRecord;

import java.util.List;

/**
 * Compliance traces for successful money movements.
 *
 * Account rules stay in {@link AccountService}. This service only stores and reads the trace.
 */
public interface AuditService {

    /**
     * Stores one trace. Called only after the account movement has been accepted.
     */
    AuditResponse record(AuditRecord audit);

    /**
     * Returns every trace, oldest first.
     */
    List<AuditResponse> getAudits();

    /**
     * Returns one trace.
     *
     * @throws com.josvier.simplebank.exception.ResourceNotFoundException if the id does not exist
     */
    AuditResponse getAudit(String auditId);
}
