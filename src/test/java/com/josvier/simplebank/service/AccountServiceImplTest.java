package com.josvier.simplebank.service;

import com.josvier.simplebank.dto.request.CreateAccountRequest;
import com.josvier.simplebank.dto.response.AccountResponse;
import com.josvier.simplebank.dto.response.TransactionResponse;
import com.josvier.simplebank.exception.InvalidTransactionException;
import com.josvier.simplebank.exception.ResourceNotFoundException;
import com.josvier.simplebank.model.Account;
import com.josvier.simplebank.model.AccountType;
import com.josvier.simplebank.model.Transaction;
import com.josvier.simplebank.model.TransactionType;
import com.josvier.simplebank.model.User;
import com.josvier.simplebank.repository.AccountRepository;
import com.josvier.simplebank.repository.TransactionRepository;
import com.josvier.simplebank.repository.UserRepository;
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

    private AccountService accountService;

    @BeforeEach
    void setUp() {
        accountService = new AccountServiceImpl(accountRepository, userRepository, transactionRepository);
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
