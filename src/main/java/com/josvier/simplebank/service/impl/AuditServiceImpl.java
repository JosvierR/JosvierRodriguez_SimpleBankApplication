package com.josvier.simplebank.service.impl;

import com.josvier.simplebank.dto.response.AuditResponse;
import com.josvier.simplebank.exception.ResourceNotFoundException;
import com.josvier.simplebank.model.AuditRecord;
import com.josvier.simplebank.model.User;
import com.josvier.simplebank.repository.AuditRepository;
import com.josvier.simplebank.repository.UserRepository;
import com.josvier.simplebank.service.AuditService;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Reads and writes audit documents.
 *
 * A missing customer name does not hide the trace. The id of that customer
 * is still returned, with the name Unknown.
 */
@Service
public class AuditServiceImpl implements AuditService {

    private final AuditRepository auditRepository;
    private final UserRepository userRepository;

    public AuditServiceImpl(AuditRepository auditRepository, UserRepository userRepository) {
        this.auditRepository = auditRepository;
        this.userRepository = userRepository;
    }

    @Override
    public AuditResponse record(AuditRecord audit) {
        return toResponse(auditRepository.save(audit));
    }

    @Override
    public List<AuditResponse> getAudits() {
        return auditRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public AuditResponse getAudit(String auditId) {
        AuditRecord audit = auditRepository.findById(auditId)
                .orElseThrow(() -> new ResourceNotFoundException("Audit with id " + auditId + " was not found"));
        return toResponse(audit);
    }

    private AuditResponse toResponse(AuditRecord audit) {
        return new AuditResponse(
                audit.getId(),
                audit.getAction(),
                audit.getUserId(),
                userName(audit.getUserId()),
                audit.getAccountIds(),
                audit.getInvolvedUserIds(),
                audit.getAmount(),
                audit.getTransactionIds(),
                audit.getCreatedAt(),
                audit.getActorAuthUserId(),
                audit.getActorUsername()
        );
    }

    private String userName(String userId) {
        return userRepository.findById(userId)
                .map(User::getName)
                .orElse("Unknown");
    }
}
