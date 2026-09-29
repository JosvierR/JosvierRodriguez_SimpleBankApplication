package com.josvier.simplebank.repository.mongo.adapter;

import com.josvier.simplebank.model.Account;
import com.josvier.simplebank.model.AccountType;
import com.josvier.simplebank.repository.mongo.document.AccountDocument;
import com.josvier.simplebank.repository.mongo.springdata.SpringDataAccountMongoRepository;
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
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MongoAccountRepositoryAdapterTest {

    private static final String ACCOUNT_ID = "68dc1234567890abcdef0002";
    private static final String USER_ID = "68dc1234567890abcdef0001";

    @Mock
    private SpringDataAccountMongoRepository accounts;

    @InjectMocks
    private MongoAccountRepositoryAdapter adapter;

    @Test
    void save_mapsBalanceAndOwnerWithoutChangingTheAmount() {
        LocalDateTime createdAt = LocalDateTime.of(2026, 9, 29, 10, 0);
        when(accounts.save(any(AccountDocument.class))).thenAnswer(invocation -> {
            AccountDocument document = invocation.getArgument(0);
            document.setId(ACCOUNT_ID);
            return document;
        });

        Account account = new Account(USER_ID, new BigDecimal("550.00"), AccountType.SAVINGS, createdAt);
        Account saved = adapter.save(account);

        ArgumentCaptor<AccountDocument> captor = ArgumentCaptor.forClass(AccountDocument.class);
        verify(accounts).save(captor.capture());
        AccountDocument sent = captor.getValue();
        assertEquals(USER_ID, sent.getUserId());
        assertEquals(AccountType.SAVINGS, sent.getAccountType());
        assertEquals(0, new BigDecimal("550.00").compareTo(sent.getBalance()));
        assertEquals(ACCOUNT_ID, saved.getId());
        assertEquals(0, new BigDecimal("550.00").compareTo(saved.getBalance()));
    }

    @Test
    void findById_mapsDocumentToDomain() {
        when(accounts.findById(ACCOUNT_ID)).thenReturn(Optional.of(document()));

        Account account = adapter.findById(ACCOUNT_ID).orElseThrow();

        assertEquals(ACCOUNT_ID, account.getId());
        assertEquals(USER_ID, account.getUserId());
        assertEquals(AccountType.CHECKING, account.getAccountType());
        assertEquals(0, new BigDecimal("0.00").compareTo(account.getBalance()));
    }

    @Test
    void findAll_delegatesToSpringData() {
        when(accounts.findAll()).thenReturn(List.of(document()));

        List<Account> found = adapter.findAll();

        assertEquals(1, found.size());
        assertEquals(ACCOUNT_ID, found.get(0).getId());
        verify(accounts).findAll();
    }

    @Test
    void findByUserId_delegatesToSpringData() {
        when(accounts.findByUserId(USER_ID)).thenReturn(List.of(document()));

        List<Account> found = adapter.findByUserId(USER_ID);

        assertEquals(1, found.size());
        assertEquals(USER_ID, found.get(0).getUserId());
        verify(accounts).findByUserId(USER_ID);
    }

    @Test
    void findById_missing_isEmpty() {
        when(accounts.findById(ACCOUNT_ID)).thenReturn(Optional.empty());

        assertTrue(adapter.findById(ACCOUNT_ID).isEmpty());
    }

    private AccountDocument document() {
        AccountDocument document = new AccountDocument();
        document.setId(ACCOUNT_ID);
        document.setUserId(USER_ID);
        document.setBalance(new BigDecimal("0.00"));
        document.setAccountType(AccountType.CHECKING);
        document.setCreatedAt(LocalDateTime.of(2026, 9, 29, 10, 0));
        return document;
    }
}
