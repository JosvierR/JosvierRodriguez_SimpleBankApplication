package com.josvier.simplebank.service;

import com.josvier.simplebank.dto.response.AuditResponse;
import com.josvier.simplebank.exception.ResourceNotFoundException;
import com.josvier.simplebank.model.AuditAction;
import com.josvier.simplebank.model.AuditRecord;
import com.josvier.simplebank.model.User;
import com.josvier.simplebank.repository.AuditRepository;
import com.josvier.simplebank.repository.UserRepository;
import com.josvier.simplebank.service.impl.AuditServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuditServiceImplTest {

    @Mock
    private AuditRepository auditRepository;

    @Mock
    private UserRepository userRepository;

    private AuditService auditService;

    @BeforeEach
    void setUp() {
        auditService = new AuditServiceImpl(auditRepository, userRepository);
    }

    @Test
    void getAudit_returnsWhoWhenAccountsAndAmount() {
        User user = new User("Josvier Rodriguez", "josvier@example.com", LocalDateTime.of(2026, 9, 29, 9, 0));
        user.setId("68dc1234567890abcdef0001");
        when(userRepository.findById("68dc1234567890abcdef0001")).thenReturn(Optional.of(user));
        AuditRecord record = audit("68dc1234567890abcdef0088");
        when(auditRepository.findById("68dc1234567890abcdef0088")).thenReturn(Optional.of(record));

        AuditResponse response = auditService.getAudit("68dc1234567890abcdef0088");

        assertEquals("68dc1234567890abcdef0088", response.id());
        assertEquals(AuditAction.TRANSFER, response.action());
        assertEquals("68dc1234567890abcdef0001", response.userId());
        assertEquals("Josvier Rodriguez", response.userName());
        assertEquals(List.of("68dc1234567890abcdef0002", "68dc1234567890abcdef0003"), response.accountIds());
        assertEquals(0, new BigDecimal("40.00").compareTo(response.amount()));
        assertEquals(record.getCreatedAt(), response.createdAt());
    }

    @Test
    void getAudit_notFound() {
        when(auditRepository.findById("68dc1234567890abcdef0099")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> auditService.getAudit("68dc1234567890abcdef0099"));
    }

    @Test
    void getAudits_returnsAllTraces() {
        User user = new User("Josvier Rodriguez", "josvier@example.com", LocalDateTime.of(2026, 9, 29, 9, 0));
        user.setId("68dc1234567890abcdef0001");
        when(userRepository.findById("68dc1234567890abcdef0001")).thenReturn(Optional.of(user));
        when(auditRepository.findAll()).thenReturn(List.of(audit("68dc1234567890abcdef0088")));

        List<AuditResponse> audits = auditService.getAudits();

        assertEquals(1, audits.size());
        assertEquals(AuditAction.TRANSFER, audits.get(0).action());
    }

    private AuditRecord audit(String id) {
        AuditRecord record = new AuditRecord(
                AuditAction.TRANSFER,
                "68dc1234567890abcdef0001",
                List.of("68dc1234567890abcdef0002", "68dc1234567890abcdef0003"),
                List.of("68dc1234567890abcdef0001", "68dc1234567890abcdef0004"),
                new BigDecimal("40.00"),
                List.of("68dc1234567890abcdef0011", "68dc1234567890abcdef0012"),
                LocalDateTime.of(2026, 9, 29, 12, 0),
                null,
                null);
        record.setId(id);
        return record;
    }
}
