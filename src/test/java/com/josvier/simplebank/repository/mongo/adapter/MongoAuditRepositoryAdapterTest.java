package com.josvier.simplebank.repository.mongo.adapter;

import com.josvier.simplebank.model.AuditAction;
import com.josvier.simplebank.model.AuditRecord;
import com.josvier.simplebank.repository.mongo.document.AuditDocument;
import com.josvier.simplebank.repository.mongo.springdata.SpringDataAuditMongoRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MongoAuditRepositoryAdapterTest {

    private static final String AUDIT_ID = "68dc1234567890abcdef0088";

    @Mock
    private SpringDataAuditMongoRepository audits;

    @InjectMocks
    private MongoAuditRepositoryAdapter adapter;

    @Test
    void save_mapsTraceAndReturnsGeneratedId() {
        LocalDateTime createdAt = LocalDateTime.of(2026, 9, 29, 12, 0);
        when(audits.save(any(AuditDocument.class))).thenAnswer(invocation -> {
            AuditDocument document = invocation.getArgument(0);
            document.setId(AUDIT_ID);
            return document;
        });

        AuditRecord saved = adapter.save(new AuditRecord(
                AuditAction.TRANSFER,
                "68dc1234567890abcdef0001",
                List.of("68dc1234567890abcdef0002", "68dc1234567890abcdef0003"),
                List.of("68dc1234567890abcdef0001"),
                new BigDecimal("25.00"),
                List.of("68dc1234567890abcdef0011"),
                createdAt));

        ArgumentCaptor<AuditDocument> captor = ArgumentCaptor.forClass(AuditDocument.class);
        verify(audits).save(captor.capture());
        assertEquals(AuditAction.TRANSFER, captor.getValue().getAction());
        assertEquals(List.of("68dc1234567890abcdef0002", "68dc1234567890abcdef0003"), captor.getValue().getAccountIds());
        assertEquals(0, new BigDecimal("25.00").compareTo(captor.getValue().getAmount()));
        assertEquals(AUDIT_ID, saved.getId());
    }

    @Test
    void findAll_delegatesInCreatedOrder() {
        when(audits.findAllByOrderByCreatedAtAsc()).thenReturn(List.of(document()));

        List<AuditRecord> found = adapter.findAll();

        assertEquals(1, found.size());
        assertEquals(AUDIT_ID, found.get(0).getId());
        verify(audits).findAllByOrderByCreatedAtAsc();
    }

    @Test
    void findById_mapsDocument() {
        when(audits.findById(AUDIT_ID)).thenReturn(Optional.of(document()));

        AuditRecord audit = adapter.findById(AUDIT_ID).orElseThrow();

        assertEquals(AuditAction.DEPOSIT, audit.getAction());
        assertEquals("68dc1234567890abcdef0001", audit.getUserId());
        assertEquals(List.of("68dc1234567890abcdef0002"), audit.getAccountIds());
    }

    private AuditDocument document() {
        AuditDocument document = new AuditDocument();
        document.setId(AUDIT_ID);
        document.setAction(AuditAction.DEPOSIT);
        document.setUserId("68dc1234567890abcdef0001");
        document.setAccountIds(List.of("68dc1234567890abcdef0002"));
        document.setInvolvedUserIds(List.of("68dc1234567890abcdef0001"));
        document.setAmount(new BigDecimal("25.00"));
        document.setTransactionIds(List.of("68dc1234567890abcdef0011"));
        document.setCreatedAt(LocalDateTime.of(2026, 9, 29, 12, 0));
        return document;
    }
}
