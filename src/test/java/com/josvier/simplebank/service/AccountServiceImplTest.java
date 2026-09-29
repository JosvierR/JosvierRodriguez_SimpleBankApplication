package com.josvier.simplebank.service;

import com.josvier.simplebank.dto.request.CreateAccountRequest;
import com.josvier.simplebank.dto.request.CreateUserRequest;
import com.josvier.simplebank.dto.response.AccountResponse;
import com.josvier.simplebank.dto.response.TransactionResponse;
import com.josvier.simplebank.dto.response.UserResponse;
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
import com.josvier.simplebank.repository.memory.InMemoryAccountRepository;
import com.josvier.simplebank.repository.memory.InMemoryTransactionRepository;
import com.josvier.simplebank.repository.memory.InMemoryUserRepository;
import com.josvier.simplebank.service.impl.AccountServiceImpl;
import com.josvier.simplebank.service.impl.UserServiceImpl;
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
            account.setId(1L);
            return account;
        });

        AccountResponse response = accountService.createAccount(new CreateAccountRequest(1L, AccountType.SAVINGS));

        assertEquals(1L, response.accountId());
        assertEquals(1L, response.userId());
        assertEquals("Josvier Rodriguez", response.userName());
        assertEquals(AccountType.SAVINGS, response.accountType());
        assertMoney("0.00", response.balance());
        assertNotNull(response.createdAt());
    }

    @Test
    void createAccount_userDoesNotExist_fails() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> accountService.createAccount(new CreateAccountRequest(99L, AccountType.CHECKING)));

        assertEquals("User with id 99 was not found", exception.getMessage());
        verify(accountRepository, never()).save(any());
    }

    @Test
    void getAccount_success() {
        stubUser();
        Account account = account(new BigDecimal("0.00"));
        when(accountRepository.findById(1L)).thenReturn(Optional.of(account));

        AccountResponse response = accountService.getAccount(1L);

        assertEquals(1L, response.accountId());
        assertEquals("Josvier Rodriguez", response.userName());
        assertEquals(AccountType.SAVINGS, response.accountType());
        assertMoney("0.00", response.balance());
    }

    @Test
    void getAccount_notFound_fails() {
        when(accountRepository.findById(999L)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> accountService.getAccount(999L));

        assertEquals("Account with id 999 was not found", exception.getMessage());
    }

    @Test
    void deposit_success() {
        stubUser();
        Account account = account(new BigDecimal("0.00"));
        when(accountRepository.findById(1L)).thenReturn(Optional.of(account));
        stubSaves();

        AccountResponse response = accountService.deposit(1L, new BigDecimal("500.00"));

        assertEquals(1L, response.accountId());
        assertEquals("Josvier Rodriguez", response.userName());
        assertMoney("500.00", response.balance());
    }

    @Test
    void deposit_updatesBalance() {
        stubUser();
        Account account = account(new BigDecimal("250.00"));
        when(accountRepository.findById(1L)).thenReturn(Optional.of(account));
        stubSaves();

        AccountResponse response = accountService.deposit(1L, new BigDecimal("500"));

        assertMoney("750.00", response.balance());
        assertMoney("750.00", account.getBalance());
    }

    @Test
    void deposit_createsTransaction() {
        stubUser();
        when(accountRepository.findById(1L)).thenReturn(Optional.of(account(new BigDecimal("0.00"))));
        stubSaves();

        accountService.deposit(1L, new BigDecimal("500.00"));

        ArgumentCaptor<Transaction> captor = ArgumentCaptor.forClass(Transaction.class);
        verify(transactionRepository).save(captor.capture());
        Transaction saved = captor.getValue();
        assertEquals(1L, saved.getAccountId());
        assertEquals(TransactionType.DEPOSIT, saved.getType());
        assertMoney("500.00", saved.getAmount());
        assertNotNull(saved.getCreatedAt());
    }

    @Test
    void deposit_zeroAmount_fails() {
        Account account = account(new BigDecimal("100.00"));
        when(accountRepository.findById(1L)).thenReturn(Optional.of(account));

        InvalidTransactionException exception = assertThrows(
                InvalidTransactionException.class,
                () -> accountService.deposit(1L, BigDecimal.ZERO));

        assertEquals("Amount must be greater than zero", exception.getMessage());
        assertMoney("100.00", account.getBalance());
        verify(accountRepository, never()).save(any());
        verify(transactionRepository, never()).save(any());
    }

    @Test
    void deposit_negativeAmount_fails() {
        Account account = account(new BigDecimal("100.00"));
        when(accountRepository.findById(1L)).thenReturn(Optional.of(account));

        assertThrows(InvalidTransactionException.class, () -> accountService.deposit(1L, new BigDecimal("-50")));

        assertMoney("100.00", account.getBalance());
        verify(accountRepository, never()).save(any());
        verify(transactionRepository, never()).save(any());
    }

    @Test
    void withdraw_success() {
        stubUser();
        when(accountRepository.findById(1L)).thenReturn(Optional.of(account(new BigDecimal("500.00"))));
        stubSaves();

        AccountResponse response = accountService.withdraw(1L, new BigDecimal("200.00"));

        assertEquals(1L, response.accountId());
        assertMoney("300.00", response.balance());
    }

    @Test
    void withdraw_updatesBalance() {
        stubUser();
        Account account = account(new BigDecimal("550.00"));
        when(accountRepository.findById(1L)).thenReturn(Optional.of(account));
        stubSaves();

        AccountResponse response = accountService.withdraw(1L, new BigDecimal("200"));

        assertMoney("350.00", response.balance());
        assertMoney("350.00", account.getBalance());
    }

    @Test
    void withdraw_createsTransaction() {
        stubUser();
        when(accountRepository.findById(1L)).thenReturn(Optional.of(account(new BigDecimal("500.00"))));
        stubSaves();

        accountService.withdraw(1L, new BigDecimal("200.00"));

        ArgumentCaptor<Transaction> captor = ArgumentCaptor.forClass(Transaction.class);
        verify(transactionRepository).save(captor.capture());
        Transaction saved = captor.getValue();
        assertEquals(1L, saved.getAccountId());
        assertEquals(TransactionType.WITHDRAW, saved.getType());
        assertMoney("200.00", saved.getAmount());
    }

    @Test
    void withdraw_insufficientFunds_fails() {
        when(accountRepository.findById(1L)).thenReturn(Optional.of(account(new BigDecimal("550.00"))));

        InvalidTransactionException exception = assertThrows(
                InvalidTransactionException.class,
                () -> accountService.withdraw(1L, new BigDecimal("1000")));

        assertEquals("Insufficient funds", exception.getMessage());
    }

    @Test
    void withdraw_insufficientFunds_doesNotModifyBalance() {
        Account account = account(new BigDecimal("550.00"));
        when(accountRepository.findById(1L)).thenReturn(Optional.of(account));

        assertThrows(InvalidTransactionException.class, () -> accountService.withdraw(1L, new BigDecimal("1000")));

        assertMoney("550.00", account.getBalance());
        verify(accountRepository, never()).save(any());
    }

    @Test
    void withdraw_insufficientFunds_doesNotCreateTransaction() {
        when(accountRepository.findById(1L)).thenReturn(Optional.of(account(new BigDecimal("550.00"))));

        assertThrows(InvalidTransactionException.class, () -> accountService.withdraw(1L, new BigDecimal("1000")));

        verify(transactionRepository, never()).save(any());
    }

    @Test
    void withdraw_zeroAmount_fails() {
        Account account = account(new BigDecimal("550.00"));
        when(accountRepository.findById(1L)).thenReturn(Optional.of(account));

        assertThrows(InvalidTransactionException.class, () -> accountService.withdraw(1L, BigDecimal.ZERO));

        assertMoney("550.00", account.getBalance());
        verify(transactionRepository, never()).save(any());
    }

    @Test
    void withdraw_negativeAmount_fails() {
        Account account = account(new BigDecimal("550.00"));
        when(accountRepository.findById(1L)).thenReturn(Optional.of(account));

        assertThrows(InvalidTransactionException.class, () -> accountService.withdraw(1L, new BigDecimal("-1")));

        assertMoney("550.00", account.getBalance());
        verify(accountRepository, never()).save(any());
        verify(transactionRepository, never()).save(any());
    }

    @Test
    void getTransactions_returnsCorrectTransactions() {
        when(accountRepository.findById(1L)).thenReturn(Optional.of(account(new BigDecimal("550.00"))));
        Transaction deposit = transaction(1L, 1L, TransactionType.DEPOSIT, "500.00");
        Transaction withdrawal = transaction(2L, 1L, TransactionType.WITHDRAW, "200.00");
        when(transactionRepository.findByAccountId(1L)).thenReturn(List.of(deposit, withdrawal));

        List<TransactionResponse> history = accountService.getTransactions(1L);

        assertEquals(2, history.size());
        assertEquals(1L, history.get(0).transactionId());
        assertEquals(TransactionType.DEPOSIT, history.get(0).type());
        assertMoney("500.00", history.get(0).amount());
        assertEquals(2L, history.get(1).transactionId());
        assertEquals(TransactionType.WITHDRAW, history.get(1).type());
        assertMoney("200.00", history.get(1).amount());
    }

    @Test
    void getTransactions_onlyReturnsTransactionsForRequestedAccount() {
        UserRepository users = new InMemoryUserRepository();
        AccountRepository accounts = new InMemoryAccountRepository();
        TransactionRepository transactions = new InMemoryTransactionRepository();
        AccountService service = new AccountServiceImpl(accounts, users, transactions);

        UserResponse user = new UserServiceImpl(users).createUser(new CreateUserRequest("Ana Lopez", "ana@example.com"));
        Account checking = accounts.save(new Account(user.id(), new BigDecimal("0.00"), AccountType.CHECKING, LocalDateTime.now()));
        Account savings = accounts.save(new Account(user.id(), new BigDecimal("0.00"), AccountType.SAVINGS, LocalDateTime.now()));

        service.deposit(checking.getId(), new BigDecimal("10.00"));
        service.deposit(savings.getId(), new BigDecimal("20.00"));
        service.withdraw(savings.getId(), new BigDecimal("5.00"));

        List<TransactionResponse> checkingHistory = service.getTransactions(checking.getId());
        List<TransactionResponse> savingsHistory = service.getTransactions(savings.getId());

        assertEquals(1, checkingHistory.size());
        assertEquals(checking.getId(), checkingHistory.get(0).accountId());
        assertEquals(TransactionType.DEPOSIT, checkingHistory.get(0).type());
        assertMoney("10.00", checkingHistory.get(0).amount());

        assertEquals(2, savingsHistory.size());
        assertTrue(savingsHistory.stream().allMatch(tx -> savings.getId().equals(tx.accountId())));
        assertEquals(TransactionType.DEPOSIT, savingsHistory.get(0).type());
        assertEquals(TransactionType.WITHDRAW, savingsHistory.get(1).type());
        assertMoney("20.00", savingsHistory.get(0).amount());
        assertMoney("5.00", savingsHistory.get(1).amount());
    }

    private void stubUser() {
        User user = new User("Josvier Rodriguez", "josvier@example.com", LocalDateTime.of(2026, 9, 29, 9, 0));
        user.setId(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
    }

    private void stubSaves() {
        when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    private Account account(BigDecimal balance) {
        Account account = new Account(1L, balance, AccountType.SAVINGS, LocalDateTime.of(2026, 9, 29, 10, 0));
        account.setId(1L);
        return account;
    }

    private Transaction transaction(Long id, Long accountId, TransactionType type, String amount) {
        Transaction transaction = new Transaction(accountId, type, new BigDecimal(amount), LocalDateTime.of(2026, 9, 29, 10, 0));
        transaction.setId(id);
        return transaction;
    }

    private static void assertMoney(String expected, BigDecimal actual) {
        assertEquals(0, new BigDecimal(expected).compareTo(actual),
                () -> "expected " + expected + " but was " + actual);
    }
}
