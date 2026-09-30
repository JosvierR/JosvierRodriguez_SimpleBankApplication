package com.josvier.simplebank.service;

import com.josvier.simplebank.dto.request.CreateAccountRequest;
import com.josvier.simplebank.dto.request.TransferRequest;
import com.josvier.simplebank.dto.request.UpdateAccountRequest;
import com.josvier.simplebank.dto.response.AccountResponse;
import com.josvier.simplebank.dto.response.AuditResponse;
import com.josvier.simplebank.dto.response.TransactionResponse;
import com.josvier.simplebank.dto.response.TransferResponse;
import com.josvier.simplebank.exception.InvalidTransactionException;
import com.josvier.simplebank.exception.ResourceConflictException;
import com.josvier.simplebank.exception.ResourceNotFoundException;
import com.josvier.simplebank.model.Account;
import com.josvier.simplebank.model.AccountType;
import com.josvier.simplebank.model.AuditAction;
import com.josvier.simplebank.model.AuditRecord;
import com.josvier.simplebank.model.Transaction;
import com.josvier.simplebank.model.TransactionType;
import com.josvier.simplebank.model.User;
import com.josvier.simplebank.repository.AccountRepository;
import com.josvier.simplebank.repository.TransactionRepository;
import com.josvier.simplebank.repository.UserRepository;
import com.josvier.simplebank.security.actor.CurrentActor;
import com.josvier.simplebank.security.actor.CurrentActorProvider;
import com.josvier.simplebank.service.AuditService;
import com.josvier.simplebank.service.impl.AccountServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccountServiceImplTest {

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private AuditService auditService;

    @Mock
    private CurrentActorProvider currentActorProvider;

    private AccountService accountService;

    @BeforeEach
    void setUp() {
        accountService = new AccountServiceImpl(
                accountRepository, userRepository, transactionRepository, auditService, currentActorProvider);
        lenient().when(currentActorProvider.current())
                .thenReturn(new CurrentActor("68dc1234567890abcdef0101", "josvier"));
    }

    @Test
    void createAccount_success() {
        stubUser();
        when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> {
            Account account = invocation.getArgument(0);
            account.setId("68dc1234567890abcdef0001");
            return account;
        });

        AccountResponse response = accountService.createAccount(new CreateAccountRequest("68dc1234567890abcdef0001", AccountType.SAVINGS));

        assertEquals("68dc1234567890abcdef0001", response.accountId());
        assertEquals("68dc1234567890abcdef0001", response.userId());
        assertEquals("Josvier Rodriguez", response.userName());
        assertEquals(AccountType.SAVINGS, response.accountType());
        assertMoney("0.00", response.balance());
        assertNotNull(response.createdAt());
    }

    @Test
    void createAccount_userDoesNotExist_fails() {
        when(userRepository.findById("68dc1234567890abcdef0099")).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> accountService.createAccount(new CreateAccountRequest("68dc1234567890abcdef0099", AccountType.CHECKING)));

        assertEquals("User with id 68dc1234567890abcdef0099 was not found", exception.getMessage());
        verify(accountRepository, never()).save(any());
    }

    @Test
    void getAccount_success() {
        stubUser();
        Account account = account(new BigDecimal("0.00"));
        when(accountRepository.findById("68dc1234567890abcdef0001")).thenReturn(Optional.of(account));

        AccountResponse response = accountService.getAccount("68dc1234567890abcdef0001");

        assertEquals("68dc1234567890abcdef0001", response.accountId());
        assertEquals("Josvier Rodriguez", response.userName());
        assertEquals(AccountType.SAVINGS, response.accountType());
        assertMoney("0.00", response.balance());
    }

    @Test
    void getAccount_notFound_fails() {
        when(accountRepository.findById("68dc1234567890abcdef0999")).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> accountService.getAccount("68dc1234567890abcdef0999"));

        assertEquals("Account with id 68dc1234567890abcdef0999 was not found", exception.getMessage());
    }

    @Test
    void deposit_success() {
        stubUser();
        Account account = account(new BigDecimal("0.00"));
        when(accountRepository.findById("68dc1234567890abcdef0001")).thenReturn(Optional.of(account));
        stubSaves();

        AccountResponse response = accountService.deposit("68dc1234567890abcdef0001", new BigDecimal("500.00"));

        assertEquals("68dc1234567890abcdef0001", response.accountId());
        assertEquals("Josvier Rodriguez", response.userName());
        assertMoney("500.00", response.balance());
    }

    @Test
    void deposit_updatesBalance() {
        stubUser();
        Account account = account(new BigDecimal("250.00"));
        when(accountRepository.findById("68dc1234567890abcdef0001")).thenReturn(Optional.of(account));
        stubSaves();

        AccountResponse response = accountService.deposit("68dc1234567890abcdef0001", new BigDecimal("500"));

        assertMoney("750.00", response.balance());
        assertMoney("750.00", account.getBalance());
    }

    @Test
    void deposit_createsTransaction() {
        stubUser();
        when(accountRepository.findById("68dc1234567890abcdef0001")).thenReturn(Optional.of(account(new BigDecimal("0.00"))));
        stubSaves();

        accountService.deposit("68dc1234567890abcdef0001", new BigDecimal("500.00"));

        ArgumentCaptor<Transaction> captor = ArgumentCaptor.forClass(Transaction.class);
        verify(transactionRepository).save(captor.capture());
        Transaction saved = captor.getValue();
        assertEquals("68dc1234567890abcdef0001", saved.getAccountId());
        assertEquals(TransactionType.DEPOSIT, saved.getType());
        assertMoney("500.00", saved.getAmount());
        assertNotNull(saved.getCreatedAt());
    }

    @Test
    void deposit_zeroAmount_fails() {
        Account account = account(new BigDecimal("100.00"));
        when(accountRepository.findById("68dc1234567890abcdef0001")).thenReturn(Optional.of(account));

        InvalidTransactionException exception = assertThrows(
                InvalidTransactionException.class,
                () -> accountService.deposit("68dc1234567890abcdef0001", BigDecimal.ZERO));

        assertEquals("Amount must be greater than zero", exception.getMessage());
        assertMoney("100.00", account.getBalance());
        verify(accountRepository, never()).save(any());
        verify(transactionRepository, never()).save(any());
    }

    @Test
    void deposit_negativeAmount_fails() {
        Account account = account(new BigDecimal("100.00"));
        when(accountRepository.findById("68dc1234567890abcdef0001")).thenReturn(Optional.of(account));

        assertThrows(InvalidTransactionException.class, () -> accountService.deposit("68dc1234567890abcdef0001", new BigDecimal("-50")));

        assertMoney("100.00", account.getBalance());
        verify(accountRepository, never()).save(any());
        verify(transactionRepository, never()).save(any());
    }

    @Test
    void withdraw_success() {
        stubUser();
        when(accountRepository.findById("68dc1234567890abcdef0001")).thenReturn(Optional.of(account(new BigDecimal("500.00"))));
        stubSaves();

        AccountResponse response = accountService.withdraw("68dc1234567890abcdef0001", new BigDecimal("200.00"));

        assertEquals("68dc1234567890abcdef0001", response.accountId());
        assertMoney("300.00", response.balance());
    }

    @Test
    void withdraw_updatesBalance() {
        stubUser();
        Account account = account(new BigDecimal("550.00"));
        when(accountRepository.findById("68dc1234567890abcdef0001")).thenReturn(Optional.of(account));
        stubSaves();

        AccountResponse response = accountService.withdraw("68dc1234567890abcdef0001", new BigDecimal("200"));

        assertMoney("350.00", response.balance());
        assertMoney("350.00", account.getBalance());
    }

    @Test
    void withdraw_createsTransaction() {
        stubUser();
        when(accountRepository.findById("68dc1234567890abcdef0001")).thenReturn(Optional.of(account(new BigDecimal("500.00"))));
        stubSaves();

        accountService.withdraw("68dc1234567890abcdef0001", new BigDecimal("200.00"));

        ArgumentCaptor<Transaction> captor = ArgumentCaptor.forClass(Transaction.class);
        verify(transactionRepository).save(captor.capture());
        Transaction saved = captor.getValue();
        assertEquals("68dc1234567890abcdef0001", saved.getAccountId());
        assertEquals(TransactionType.WITHDRAW, saved.getType());
        assertMoney("200.00", saved.getAmount());
    }

    @Test
    void withdraw_insufficientFunds_fails() {
        when(accountRepository.findById("68dc1234567890abcdef0001")).thenReturn(Optional.of(account(new BigDecimal("550.00"))));

        InvalidTransactionException exception = assertThrows(
                InvalidTransactionException.class,
                () -> accountService.withdraw("68dc1234567890abcdef0001", new BigDecimal("1000")));

        assertEquals("Insufficient funds", exception.getMessage());
    }

    @Test
    void withdraw_insufficientFunds_doesNotModifyBalance() {
        Account account = account(new BigDecimal("550.00"));
        when(accountRepository.findById("68dc1234567890abcdef0001")).thenReturn(Optional.of(account));

        assertThrows(InvalidTransactionException.class, () -> accountService.withdraw("68dc1234567890abcdef0001", new BigDecimal("1000")));

        assertMoney("550.00", account.getBalance());
        verify(accountRepository, never()).save(any());
    }

    @Test
    void withdraw_insufficientFunds_doesNotCreateTransaction() {
        when(accountRepository.findById("68dc1234567890abcdef0001")).thenReturn(Optional.of(account(new BigDecimal("550.00"))));

        assertThrows(InvalidTransactionException.class, () -> accountService.withdraw("68dc1234567890abcdef0001", new BigDecimal("1000")));

        verify(transactionRepository, never()).save(any());
    }

    @Test
    void withdraw_zeroAmount_fails() {
        Account account = account(new BigDecimal("550.00"));
        when(accountRepository.findById("68dc1234567890abcdef0001")).thenReturn(Optional.of(account));

        assertThrows(InvalidTransactionException.class, () -> accountService.withdraw("68dc1234567890abcdef0001", BigDecimal.ZERO));

        assertMoney("550.00", account.getBalance());
        verify(transactionRepository, never()).save(any());
    }

    @Test
    void withdraw_negativeAmount_fails() {
        Account account = account(new BigDecimal("550.00"));
        when(accountRepository.findById("68dc1234567890abcdef0001")).thenReturn(Optional.of(account));

        assertThrows(InvalidTransactionException.class, () -> accountService.withdraw("68dc1234567890abcdef0001", new BigDecimal("-1")));

        assertMoney("550.00", account.getBalance());
        verify(accountRepository, never()).save(any());
        verify(transactionRepository, never()).save(any());
    }

    @Test
    void getTransactions_returnsCorrectTransactions() {
        when(accountRepository.findById("68dc1234567890abcdef0001")).thenReturn(Optional.of(account(new BigDecimal("550.00"))));
        Transaction deposit = transaction("68dc1234567890abcdef0001", "68dc1234567890abcdef0001", TransactionType.DEPOSIT, "500.00");
        Transaction withdrawal = transaction("68dc1234567890abcdef0002", "68dc1234567890abcdef0001", TransactionType.WITHDRAW, "200.00");
        when(transactionRepository.findByAccountId("68dc1234567890abcdef0001")).thenReturn(List.of(deposit, withdrawal));

        List<TransactionResponse> history = accountService.getTransactions("68dc1234567890abcdef0001");

        assertEquals(2, history.size());
        assertEquals("68dc1234567890abcdef0001", history.get(0).transactionId());
        assertEquals(TransactionType.DEPOSIT, history.get(0).type());
        assertMoney("500.00", history.get(0).amount());
        assertEquals("68dc1234567890abcdef0002", history.get(1).transactionId());
        assertEquals(TransactionType.WITHDRAW, history.get(1).type());
        assertMoney("200.00", history.get(1).amount());
    }

    @Test
    void getTransactions_onlyReturnsTransactionsForRequestedAccount() {
        String checkingId = "68dc1234567890abcdef0002";
        String savingsId = "68dc1234567890abcdef0003";
        when(accountRepository.findById(checkingId)).thenReturn(Optional.of(accountWith(checkingId, new BigDecimal("10.00"))));
        when(accountRepository.findById(savingsId)).thenReturn(Optional.of(accountWith(savingsId, new BigDecimal("15.00"))));
        when(transactionRepository.findByAccountId(checkingId)).thenReturn(List.of(
                transaction("68dc1234567890abcdef0011", checkingId, TransactionType.DEPOSIT, "10.00")));
        when(transactionRepository.findByAccountId(savingsId)).thenReturn(List.of(
                transaction("68dc1234567890abcdef0012", savingsId, TransactionType.DEPOSIT, "20.00"),
                transaction("68dc1234567890abcdef0013", savingsId, TransactionType.WITHDRAW, "5.00")));

        List<TransactionResponse> checkingHistory = accountService.getTransactions(checkingId);
        List<TransactionResponse> savingsHistory = accountService.getTransactions(savingsId);

        assertEquals(1, checkingHistory.size());
        assertEquals(checkingId, checkingHistory.get(0).accountId());
        assertEquals(TransactionType.DEPOSIT, checkingHistory.get(0).type());
        assertMoney("10.00", checkingHistory.get(0).amount());

        assertEquals(2, savingsHistory.size());
        assertTrue(savingsHistory.stream().allMatch(tx -> savingsId.equals(tx.accountId())));
        assertEquals(TransactionType.DEPOSIT, savingsHistory.get(0).type());
        assertEquals(TransactionType.WITHDRAW, savingsHistory.get(1).type());
        assertMoney("20.00", savingsHistory.get(0).amount());
        assertMoney("5.00", savingsHistory.get(1).amount());
    }

    @Test
    void getAccounts_returnsAllAccounts() {
        stubUser();
        User second = new User("Customer Two", "customer2@example.com", LocalDateTime.of(2026, 9, 29, 9, 0));
        second.setId("68dc1234567890abcdef0002");
        when(userRepository.findById("68dc1234567890abcdef0002")).thenReturn(Optional.of(second));
        Account secondAccount = new Account("68dc1234567890abcdef0002", new BigDecimal("15.00"), AccountType.CHECKING, LocalDateTime.of(2026, 9, 29, 11, 0));
        secondAccount.setId("68dc1234567890abcdef0003");
        when(accountRepository.findAll()).thenReturn(List.of(account(new BigDecimal("10.00")), secondAccount));

        List<AccountResponse> accounts = accountService.getAccounts();

        assertEquals(2, accounts.size());
        assertEquals("68dc1234567890abcdef0001", accounts.get(0).accountId());
        assertEquals("Josvier Rodriguez", accounts.get(0).userName());
        assertEquals("68dc1234567890abcdef0003", accounts.get(1).accountId());
        assertEquals("Customer Two", accounts.get(1).userName());
    }

    @Test
    void getAccounts_missingOwner_returnsNotFound() {
        when(accountRepository.findAll()).thenReturn(List.of(account(new BigDecimal("10.00"))));
        when(userRepository.findById("68dc1234567890abcdef0001")).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class, () -> accountService.getAccounts());

        assertEquals("User with id 68dc1234567890abcdef0001 was not found", exception.getMessage());
    }

    @Test
    void getAccountsByUser_returnsOnlyThatUsersAccounts() {
        stubUser();
        Account savings = account(new BigDecimal("10.00"));
        Account checking = accountWith("68dc1234567890abcdef0002", new BigDecimal("20.00"));
        when(accountRepository.findByUserId("68dc1234567890abcdef0001")).thenReturn(List.of(savings, checking));

        List<AccountResponse> accounts = accountService.getAccountsByUser("68dc1234567890abcdef0001");

        assertEquals(2, accounts.size());
        assertTrue(accounts.stream().allMatch(account -> "68dc1234567890abcdef0001".equals(account.userId())));
        assertEquals("68dc1234567890abcdef0001", accounts.get(0).accountId());
        assertEquals("68dc1234567890abcdef0002", accounts.get(1).accountId());
    }

    @Test
    void getAccountsByUser_userMissing_returnsNotFound() {
        when(userRepository.findById("68dc1234567890abcdef0099")).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> accountService.getAccountsByUser("68dc1234567890abcdef0099"));

        assertEquals("User with id 68dc1234567890abcdef0099 was not found", exception.getMessage());
        verify(accountRepository, never()).findByUserId(any());
    }

    @Test
    void getAccountsByUser_noAccounts_returnsEmptyList() {
        stubUser();
        when(accountRepository.findByUserId("68dc1234567890abcdef0001")).thenReturn(List.of());

        List<AccountResponse> accounts = accountService.getAccountsByUser("68dc1234567890abcdef0001");

        assertTrue(accounts.isEmpty());
    }

    @Test
    void updateAccount_changesTypeAndPreservesIdentityAndBalance() {
        stubUser();
        Account account = account(new BigDecimal("25.00"));
        when(accountRepository.findById("68dc1234567890abcdef0001")).thenReturn(Optional.of(account));
        when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AccountResponse response = accountService.updateAccount(
                "68dc1234567890abcdef0001", new UpdateAccountRequest(AccountType.CHECKING));

        assertEquals("68dc1234567890abcdef0001", response.accountId());
        assertEquals("68dc1234567890abcdef0001", response.userId());
        assertEquals(AccountType.CHECKING, response.accountType());
        assertMoney("25.00", response.balance());
        assertEquals(LocalDateTime.of(2026, 9, 29, 10, 0), response.createdAt());
    }

    @Test
    void updateAccount_notFound() {
        when(accountRepository.findById("68dc1234567890abcdef0999")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> accountService.updateAccount("68dc1234567890abcdef0999", new UpdateAccountRequest(AccountType.CHECKING)));
        verify(accountRepository, never()).save(any());
    }

    @Test
    void deleteAccount_success() {
        when(accountRepository.findById("68dc1234567890abcdef0001")).thenReturn(Optional.of(account(new BigDecimal("0.00"))));
        when(transactionRepository.findByAccountId("68dc1234567890abcdef0001")).thenReturn(List.of());

        accountService.deleteAccount("68dc1234567890abcdef0001");

        verify(accountRepository).deleteById("68dc1234567890abcdef0001");
    }

    @Test
    void deleteAccount_notFound() {
        when(accountRepository.findById("68dc1234567890abcdef0999")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> accountService.deleteAccount("68dc1234567890abcdef0999"));
        verify(accountRepository, never()).deleteById(any());
    }

    @Test
    void deleteAccount_withTransactions_returnsConflict() {
        when(accountRepository.findById("68dc1234567890abcdef0001")).thenReturn(Optional.of(account(new BigDecimal("10.00"))));
        when(transactionRepository.findByAccountId("68dc1234567890abcdef0001")).thenReturn(List.of(
                transaction("68dc1234567890abcdef0011", "68dc1234567890abcdef0001", TransactionType.DEPOSIT, "10.00")));

        ResourceConflictException exception = assertThrows(ResourceConflictException.class,
                () -> accountService.deleteAccount("68dc1234567890abcdef0001"));

        assertEquals("Account cannot be deleted while transactions still exist", exception.getMessage());
        verify(accountRepository, never()).deleteById(any());
    }

    @Test
    void getPremiumAccounts_returnsAccountsAtOrAboveThreshold() {
        stubUser();
        when(accountRepository.findByBalanceGreaterThanEqual(new BigDecimal("100.00")))
                .thenReturn(List.of(account(new BigDecimal("150.00"))));

        List<AccountResponse> premium = accountService.getPremiumAccounts(new BigDecimal("100.00"));

        assertEquals(1, premium.size());
        assertMoney("150.00", premium.get(0).balance());
        verify(accountRepository).findByBalanceGreaterThanEqual(new BigDecimal("100.00"));
    }

    @Test
    void getPremiumAccounts_negativeThreshold_fails() {
        assertThrows(InvalidTransactionException.class, () -> accountService.getPremiumAccounts(new BigDecimal("-1")));
        verify(accountRepository, never()).findByBalanceGreaterThanEqual(any());
    }

    @Test
    void transfer_success_movesMoneyAndWritesAuditForBothAccounts() {
        stubUser();
        Account source = account(new BigDecimal("500.00"));
        Account destination = accountWith("68dc1234567890abcdef0002", new BigDecimal("20.00"));
        when(accountRepository.findById("68dc1234567890abcdef0001")).thenReturn(Optional.of(source));
        when(accountRepository.findById("68dc1234567890abcdef0002")).thenReturn(Optional.of(destination));
        when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(auditService.record(any(AuditRecord.class))).thenAnswer(invocation -> {
            AuditRecord record = invocation.getArgument(0);
            record.setId("68dc1234567890abcdef0088");
            return new AuditResponse(
                    record.getId(),
                    record.getAction(),
                    record.getUserId(),
                    "Josvier Rodriguez",
                    record.getAccountIds(),
                    record.getInvolvedUserIds(),
                    record.getAmount(),
                    record.getTransactionIds(),
                    record.getCreatedAt(),
                    record.getActorAuthUserId(),
                    record.getActorUsername());
        });

        TransferResponse response = accountService.transfer(new TransferRequest(
                "68dc1234567890abcdef0001", "68dc1234567890abcdef0002", new BigDecimal("100.00")));

        assertEquals("68dc1234567890abcdef0001", response.fromAccountId());
        assertEquals("68dc1234567890abcdef0002", response.toAccountId());
        assertMoney("100.00", response.amount());
        assertMoney("400.00", response.fromBalance());
        assertMoney("120.00", response.toBalance());
        assertEquals("68dc1234567890abcdef0088", response.auditId());
        ArgumentCaptor<AuditRecord> audit = ArgumentCaptor.forClass(AuditRecord.class);
        verify(auditService).record(audit.capture());
        assertEquals(AuditAction.TRANSFER, audit.getValue().getAction());
        assertEquals("68dc1234567890abcdef0001", audit.getValue().getUserId());
        assertEquals(List.of("68dc1234567890abcdef0001", "68dc1234567890abcdef0002"), audit.getValue().getAccountIds());
        assertMoney("100.00", audit.getValue().getAmount());
    }

    @Test
    void transfer_sameAccount_fails() {
        InvalidTransactionException exception = assertThrows(InvalidTransactionException.class,
                () -> accountService.transfer(new TransferRequest(
                        "68dc1234567890abcdef0001", "68dc1234567890abcdef0001", new BigDecimal("10.00"))));

        assertEquals("Cannot transfer to the same account", exception.getMessage());
        verify(accountRepository, never()).save(any());
        verify(auditService, never()).record(any());
    }

    @Test
    void transfer_insufficientFunds_changesNothing() {
        stubUser();
        when(accountRepository.findById("68dc1234567890abcdef0001")).thenReturn(Optional.of(account(new BigDecimal("10.00"))));
        when(accountRepository.findById("68dc1234567890abcdef0002")).thenReturn(Optional.of(accountWith("68dc1234567890abcdef0002", new BigDecimal("0.00"))));

        assertThrows(InvalidTransactionException.class,
                () -> accountService.transfer(new TransferRequest(
                        "68dc1234567890abcdef0001", "68dc1234567890abcdef0002", new BigDecimal("50.00"))));

        verify(accountRepository, never()).save(any());
        verify(transactionRepository, never()).save(any());
        verify(auditService, never()).record(any());
    }

    @Test
    void transfer_missingAccount_fails() {
        when(accountRepository.findById("68dc1234567890abcdef0001")).thenReturn(Optional.of(account(new BigDecimal("50.00"))));
        when(accountRepository.findById("68dc1234567890abcdef0999")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> accountService.transfer(new TransferRequest(
                        "68dc1234567890abcdef0001", "68dc1234567890abcdef0999", new BigDecimal("10.00"))));

        verify(accountRepository, never()).save(any());
        verify(auditService, never()).record(any());
    }

    @Test
    void deposit_auditContainsAuthenticatedActor() {
        stubUser();
        when(accountRepository.findById("68dc1234567890abcdef0001")).thenReturn(Optional.of(account(new BigDecimal("0.00"))));
        stubSaves();

        accountService.deposit("68dc1234567890abcdef0001", new BigDecimal("500.00"));

        AuditRecord audit = capturedAudit();
        assertEquals(AuditAction.DEPOSIT, audit.getAction());
        assertEquals("68dc1234567890abcdef0001", audit.getUserId());
        assertEquals("68dc1234567890abcdef0101", audit.getActorAuthUserId());
        assertEquals("josvier", audit.getActorUsername());
    }

    @Test
    void withdraw_auditContainsAuthenticatedActor() {
        stubUser();
        when(accountRepository.findById("68dc1234567890abcdef0001")).thenReturn(Optional.of(account(new BigDecimal("500.00"))));
        stubSaves();

        accountService.withdraw("68dc1234567890abcdef0001", new BigDecimal("200.00"));

        AuditRecord audit = capturedAudit();
        assertEquals(AuditAction.WITHDRAW, audit.getAction());
        assertEquals("68dc1234567890abcdef0001", audit.getUserId());
        assertEquals("josvier", audit.getActorUsername());
    }

    @Test
    void transfer_auditContainsAuthenticatedActor() {
        stubUser();
        when(accountRepository.findById("68dc1234567890abcdef0001")).thenReturn(Optional.of(account(new BigDecimal("500.00"))));
        when(accountRepository.findById("68dc1234567890abcdef0002"))
                .thenReturn(Optional.of(accountWith("68dc1234567890abcdef0002", new BigDecimal("20.00"))));
        when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> {
            Transaction saved = invocation.getArgument(0);
            if (saved.getId() == null) {
                saved.setId(saved.getType() == TransactionType.WITHDRAW
                        ? "68dc1234567890abcdef0011"
                        : "68dc1234567890abcdef0012");
            }
            return saved;
        });
        when(auditService.record(any(AuditRecord.class))).thenAnswer(invocation -> {
            AuditRecord record = invocation.getArgument(0);
            record.setId("68dc1234567890abcdef0088");
            return new AuditResponse(
                    record.getId(),
                    record.getAction(),
                    record.getUserId(),
                    "Customer Two",
                    record.getAccountIds(),
                    record.getInvolvedUserIds(),
                    record.getAmount(),
                    record.getTransactionIds(),
                    record.getCreatedAt(),
                    record.getActorAuthUserId(),
                    record.getActorUsername());
        });

        accountService.transfer(new TransferRequest(
                "68dc1234567890abcdef0001", "68dc1234567890abcdef0002", new BigDecimal("100.00")));

        AuditRecord audit = capturedAudit();
        assertEquals(AuditAction.TRANSFER, audit.getAction());
        assertEquals(List.of("68dc1234567890abcdef0001", "68dc1234567890abcdef0002"), audit.getAccountIds());
        assertEquals(2, audit.getTransactionIds().size());
        assertEquals("68dc1234567890abcdef0101", audit.getActorAuthUserId());
        assertEquals("josvier", audit.getActorUsername());
    }

    @Test
    void rejectedDeposit_createsNoAudit() {
        when(accountRepository.findById("68dc1234567890abcdef0001")).thenReturn(Optional.of(account(new BigDecimal("100.00"))));

        assertThrows(InvalidTransactionException.class,
                () -> accountService.deposit("68dc1234567890abcdef0001", new BigDecimal("0")));

        verify(auditService, never()).record(any());
    }

    @Test
    void rejectedWithdrawal_createsNoAudit() {
        when(accountRepository.findById("68dc1234567890abcdef0001")).thenReturn(Optional.of(account(new BigDecimal("10.00"))));

        assertThrows(InvalidTransactionException.class,
                () -> accountService.withdraw("68dc1234567890abcdef0001", new BigDecimal("50.00")));

        verify(auditService, never()).record(any());
    }

    @Test
    void rejectedTransfer_createsNoAudit() {
        stubUser();
        when(accountRepository.findById("68dc1234567890abcdef0001")).thenReturn(Optional.of(account(new BigDecimal("10.00"))));
        when(accountRepository.findById("68dc1234567890abcdef0002"))
                .thenReturn(Optional.of(accountWith("68dc1234567890abcdef0002", new BigDecimal("0.00"))));

        assertThrows(InvalidTransactionException.class,
                () -> accountService.transfer(new TransferRequest(
                        "68dc1234567890abcdef0001", "68dc1234567890abcdef0002", new BigDecimal("50.00"))));

        verify(auditService, never()).record(any());
    }

    private AuditRecord capturedAudit() {
        ArgumentCaptor<AuditRecord> audit = ArgumentCaptor.forClass(AuditRecord.class);
        verify(auditService).record(audit.capture());
        return audit.getValue();
    }

    private void stubUser() {
        User user = new User("Josvier Rodriguez", "josvier@example.com", LocalDateTime.of(2026, 9, 29, 9, 0));
        user.setId("68dc1234567890abcdef0001");
        when(userRepository.findById("68dc1234567890abcdef0001")).thenReturn(Optional.of(user));
    }

    private void stubSaves() {
        when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    private Account account(BigDecimal balance) {
        return accountWith("68dc1234567890abcdef0001", balance);
    }

    private Account accountWith(String accountId, BigDecimal balance) {
        Account account = new Account("68dc1234567890abcdef0001", balance, AccountType.SAVINGS, LocalDateTime.of(2026, 9, 29, 10, 0));
        account.setId(accountId);
        return account;
    }

    private Transaction transaction(String id, String accountId, TransactionType type, String amount) {
        Transaction transaction = new Transaction(accountId, type, new BigDecimal(amount), LocalDateTime.of(2026, 9, 29, 10, 0));
        transaction.setId(id);
        return transaction;
    }

    private static void assertMoney(String expected, BigDecimal actual) {
        assertEquals(0, new BigDecimal(expected).compareTo(actual),
                () -> "expected " + expected + " but was " + actual);
    }
}
