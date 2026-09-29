package com.josvier.simplebank.service.impl;

import com.josvier.simplebank.dto.request.CreateAccountRequest;
import com.josvier.simplebank.dto.response.AccountResponse;
import com.josvier.simplebank.dto.response.TransactionResponse;
import com.josvier.simplebank.exception.InvalidTransactionException;
import com.josvier.simplebank.exception.ResourceNotFoundException;
import com.josvier.simplebank.model.Account;
import com.josvier.simplebank.model.Transaction;
import com.josvier.simplebank.model.TransactionType;
import com.josvier.simplebank.model.User;
import com.josvier.simplebank.repository.AccountRepository;
import com.josvier.simplebank.repository.TransactionRepository;
import com.josvier.simplebank.repository.UserRepository;
import com.josvier.simplebank.service.AccountService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service responsible for banking account operations.
 *
 * Deposits, withdrawals, and balance checks live here instead of in the
 * controller so the rules stay reusable and can be tested without HTTP.
 * The balance is not changed until every check for that operation has passed.
 *
 * {@link Transactional} deposit and withdraw methods run the account update
 * and the history insert inside one MongoDB transaction. If the history
 * insert fails, the balance update rolls back with it.
 *
 * The map below is only a process-local lock. It stops two threads in this
 * JVM from applying the same account's balance at the same time. It is not
 * account storage, and it does not coordinate other application instances.
 * Durable atomicity is the MongoDB transaction.
 */
@Service
public class AccountServiceImpl implements AccountService {

    private static final int MONEY_SCALE = 2;

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;

    private final ConcurrentHashMap<String, Object> accountLocks = new ConcurrentHashMap<>();

    public AccountServiceImpl(AccountRepository accountRepository,
                              UserRepository userRepository,
                              TransactionRepository transactionRepository) {
        this.accountRepository = accountRepository;
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
    }

    @Override
    public AccountResponse createAccount(CreateAccountRequest request) {
        User user = findUser(request.userId());
        Account account = new Account(user.getId(), zeroMoney(), request.accountType(), LocalDateTime.now());
        Account saved = accountRepository.save(account);
        return toAccountResponse(saved, user);
    }

    @Override
    public AccountResponse getAccount(String accountId) {
        synchronized (lockFor(accountId)) {
            Account account = findAccount(accountId);
            User user = findUser(account.getUserId());
            return toAccountResponse(account, user);
        }
    }

    @Override
    @Transactional
    public AccountResponse deposit(String accountId, BigDecimal amount) {
        synchronized (lockFor(accountId)) {
            Account account = findAccount(accountId);
            BigDecimal normalizedAmount = requirePositiveAmount(amount);

            BigDecimal newBalance = scale(account.getBalance().add(normalizedAmount));
            account.setBalance(newBalance);
            Account saved = accountRepository.save(account);
            recordTransaction(saved.getId(), TransactionType.DEPOSIT, normalizedAmount);
            return toAccountResponse(saved, findUser(saved.getUserId()));
        }
    }

    @Override
    @Transactional
    public AccountResponse withdraw(String accountId, BigDecimal amount) {
        synchronized (lockFor(accountId)) {
            Account account = findAccount(accountId);
            BigDecimal normalizedAmount = requirePositiveAmount(amount);

            // compareTo > 0 means the requested amount is larger than the balance.
            // Throwing here skips both the balance update and the transaction insert.
            if (normalizedAmount.compareTo(account.getBalance()) > 0) {
                throw new InvalidTransactionException("Insufficient funds");
            }

            BigDecimal newBalance = scale(account.getBalance().subtract(normalizedAmount));
            account.setBalance(newBalance);
            Account saved = accountRepository.save(account);
            recordTransaction(saved.getId(), TransactionType.WITHDRAW, normalizedAmount);
            return toAccountResponse(saved, findUser(saved.getUserId()));
        }
    }

    @Override
    public List<TransactionResponse> getTransactions(String accountId) {
        synchronized (lockFor(accountId)) {
            findAccount(accountId);
            return transactionRepository.findByAccountId(accountId).stream()
                    .map(this::toTransactionResponse)
                    .toList();
        }
    }

    /**
     * Stores the history row after the account save. Both calls participate
     * in the transaction started by {@link #deposit} or {@link #withdraw}.
     */
    private void recordTransaction(String accountId, TransactionType type, BigDecimal amount) {
        transactionRepository.save(new Transaction(accountId, type, amount, LocalDateTime.now()));
    }

    private Account findAccount(String accountId) {
        return accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account with id " + accountId + " was not found"));
    }

    private User findUser(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User with id " + userId + " was not found"));
    }

    /**
     * Amounts are scaled to cents before the positive check so a value that
     * rounds to zero is rejected and never applied to the balance.
     */
    private BigDecimal requirePositiveAmount(BigDecimal amount) {
        if (amount == null) {
            throw new InvalidTransactionException("Amount must be greater than zero");
        }
        BigDecimal normalized = scale(amount);
        if (normalized.compareTo(BigDecimal.ZERO) <= 0) {
            throw new InvalidTransactionException("Amount must be greater than zero");
        }
        return normalized;
    }

    private BigDecimal scale(BigDecimal amount) {
        return amount.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    private BigDecimal zeroMoney() {
        return new BigDecimal("0.00");
    }

    private Object lockFor(String accountId) {
        return accountLocks.computeIfAbsent(accountId, id -> new Object());
    }

    private AccountResponse toAccountResponse(Account account, User user) {
        return new AccountResponse(
                account.getId(),
                account.getUserId(),
                user.getName(),
                account.getAccountType(),
                account.getBalance(),
                account.getCreatedAt()
        );
    }

    private TransactionResponse toTransactionResponse(Transaction transaction) {
        return new TransactionResponse(
                transaction.getId(),
                transaction.getAccountId(),
                transaction.getType(),
                transaction.getAmount(),
                transaction.getCreatedAt()
        );
    }
}
