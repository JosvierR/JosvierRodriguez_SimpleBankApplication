package com.josvier.simplebank.repository.mongo.adapter;

import com.josvier.simplebank.model.Transaction;
import com.josvier.simplebank.model.TransactionType;
import com.josvier.simplebank.repository.mongo.document.TransactionDocument;
import com.josvier.simplebank.repository.mongo.springdata.SpringDataTransactionMongoRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MongoTransactionRepositoryAdapterTest {

    private static final String ACCOUNT_ID = "68dc1234567890abcdef0002";

    @Mock
    private SpringDataTransactionMongoRepository transactions;

    @InjectMocks
    private MongoTransactionRepositoryAdapter adapter;

    @Test
    void save_mapsTypeAndAmount() {
        LocalDateTime createdAt = LocalDateTime.of(2026, 9, 29, 10, 0);
        when(transactions.save(any(TransactionDocument.class))).thenAnswer(invocation -> {
            TransactionDocument document = invocation.getArgument(0);
            document.setId("68dc1234567890abcdef0011");
            return document;
        });

        Transaction saved = adapter.save(new Transaction(ACCOUNT_ID, TransactionType.DEPOSIT, new BigDecimal("500.00"), createdAt));

        ArgumentCaptor<TransactionDocument> captor = ArgumentCaptor.forClass(TransactionDocument.class);
        verify(transactions).save(captor.capture());
        assertEquals(ACCOUNT_ID, captor.getValue().getAccountId());
        assertEquals(TransactionType.DEPOSIT, captor.getValue().getType());
        assertEquals(0, new BigDecimal("500.00").compareTo(captor.getValue().getAmount()));
        assertEquals("68dc1234567890abcdef0011", saved.getId());
    }

    @Test
    void findByAccountId_delegatesOrderedQueryAndKeepsThatOrder() {
        when(transactions.findByAccountIdOrderByCreatedAtAscIdAsc(ACCOUNT_ID)).thenReturn(List.of(
                document("68dc1234567890abcdef0011", TransactionType.DEPOSIT, "500.00"),
                document("68dc1234567890abcdef0012", TransactionType.WITHDRAW, "200.00")
        ));

        List<Transaction> history = adapter.findByAccountId(ACCOUNT_ID);

        verify(transactions).findByAccountIdOrderByCreatedAtAscIdAsc(ACCOUNT_ID);
        assertEquals(2, history.size());
        assertEquals(TransactionType.DEPOSIT, history.get(0).getType());
        assertEquals(TransactionType.WITHDRAW, history.get(1).getType());
        assertEquals(ACCOUNT_ID, history.get(0).getAccountId());
    }

    @Test
    void findByAccountId_null_doesNotQuery() {
        assertTrue(adapter.findByAccountId(null).isEmpty());
        verify(transactions, never()).findByAccountIdOrderByCreatedAtAscIdAsc(any());
    }

    private TransactionDocument document(String id, TransactionType type, String amount) {
        TransactionDocument document = new TransactionDocument();
        document.setId(id);
        document.setAccountId(ACCOUNT_ID);
        document.setType(type);
        document.setAmount(new BigDecimal(amount));
        document.setCreatedAt(LocalDateTime.of(2026, 9, 29, 10, 0));
        return document;
    }
}
