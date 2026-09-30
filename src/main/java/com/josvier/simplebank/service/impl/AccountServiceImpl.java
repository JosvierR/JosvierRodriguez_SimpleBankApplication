package com.josvier.simplebank.service.impl;

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
import com.josvier.simplebank.model.AuditAction;
import com.josvier.simplebank.model.AuditRecord;
import com.josvier.simplebank.model.Transaction;
import com.josvier.simplebank.model.TransactionType;
import com.josvier.simplebank.model.User;
import com.josvier.simplebank.repository.AccountRepository;
import com.josvier.simplebank.repository.TransactionRepository;
import com.josvier.simplebank.repository.UserRepository;
import com.josvier.simplebank.service.AccountService;
import com.josvier.simplebank.service.AuditService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service responsible for banking account operations.
 *
 * Deposits, withdrawals, and balance checks live here instead of in the
 * controller so the rules stay reusable and can be tested without HTTP.
 * The balance is not changed until every check for that operation has passed.
 *
 * {@link Transactional} deposit, withdraw, and transfer methods run the account
 * update, the history insert, and the audit insert inside one MongoDB transaction.
 * If a later write fails, the earlier writes roll back with it.
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
    private final AuditService auditService;

    private final ConcurrentHashMap<String, Object> accountLocks = new ConcurrentHashMap<>();

    public AccountServiceImpl(AccountRepository accountRepository,
                              UserRepository userRepository,
                              TransactionRepository transactionRepository,
                              AuditService auditService) {
        this.accountRepository = accountRepository;
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
        this.auditService = auditService;
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
    public List<AccountResponse> getAccounts() {
        return accountRepository.findAll().stream()
                .map(account -> toAccountResponse(account, findUser(account.getUserId())))
                .toList();
    }

    @Override
    public List<AccountResponse> getAccountsByUser(String userId) {
        User user = findUser(userId);
        return accountRepository.findByUserId(userId).stream()
                .map(account -> toAccountResponse(account, user))
                .toList();
    }

    @Override
    public List<AccountResponse> getPremiumAccounts(BigDecimal threshold) {
        BigDecimal minimum = requireThreshold(threshold);
        return accountRepository.findByBalanceGreaterThanEqual(minimum).stream()
                .map(account -> toAccountResponse(account, findUser(account.getUserId())))
                .toList();
    }

    @Override
    public AccountResponse updateAccount(String accountId, UpdateAccountRequest request) {
        synchronized (lockFor(accountId)) {
            Account account = findAccount(accountId);
            User user = findUser(account.getUserId());
            account.changeType(request.accountType());
            return toAccountResponse(accountRepository.save(account), user);
        }
    }

    @Override
    public void deleteAccount(String accountId) {
        synchronized (lockFor(accountId)) {
            findAccount(accountId);
            if (!transactionRepository.findByAccountId(accountId).isEmpty()) {
                throw new ResourceConflictException("Account cannot be deleted while transactions still exist");
            }
            accountRepository.deleteById(accountId);
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
            User user = findUser(saved.getUserId());
            Transaction transaction = recordTransaction(saved.getId(), TransactionType.DEPOSIT, normalizedAmount);
            recordAudit(AuditAction.DEPOSIT, user, List.of(saved.getId()), List.of(user.getId()), normalizedAmount, List.of(transaction));
            return toAccountResponse(saved, user);
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
            User user = findUser(saved.getUserId());
            Transaction transaction = recordTransaction(saved.getId(), TransactionType.WITHDRAW, normalizedAmount);
            recordAudit(AuditAction.WITHDRAW, user, List.of(saved.getId()), List.of(user.getId()), normalizedAmount, List.of(transaction));
            return toAccountResponse(saved, user);
        }
    }

    @Override
    @Transactional
    public TransferResponse transfer(TransferRequest request) {
        if (request.fromAccountId().equals(request.toAccountId())) {
            throw new InvalidTransactionException("Cannot transfer to the same account");
        }
        String firstLock = request.fromAccountId().compareTo(request.toAccountId()) <= 0
                ? request.fromAccountId()
                : request.toAccountId();
        String secondLock = firstLock.equals(request.fromAccountId())
                ? request.toAccountId()
                : request.fromAccountId();

        synchronized (lockFor(firstLock)) {
            synchronized (lockFor(secondLock)) {
                Account from = findAccount(request.fromAccountId());
                Account to = findAccount(request.toAccountId());
                User fromUser = findUser(from.getUserId());
                User toUser = findUser(to.getUserId());
                BigDecimal normalizedAmount = requirePositiveAmount(request.amount());
                if (normalizedAmount.compareTo(from.getBalance()) > 0) {
                    throw new InvalidTransactionException("Insufficient funds");
                }

                LocalDateTime when = LocalDateTime.now();
                from.setBalance(scale(from.getBalance().subtract(normalizedAmount)));
                to.setBalance(scale(to.getBalance().add(normalizedAmount)));
                Account savedFrom = accountRepository.save(from);
                Account savedTo = accountRepository.save(to);
                Transaction withdrawal = transactionRepository.save(
                        new Transaction(savedFrom.getId(), TransactionType.WITHDRAW, normalizedAmount, when));
                Transaction deposit = transactionRepository.save(
                        new Transaction(savedTo.getId(), TransactionType.DEPOSIT, normalizedAmount, when));
                List<String> involvedUsers = fromUser.getId().equals(toUser.getId())
                        ? List.of(fromUser.getId())
                        : List.of(fromUser.getId(), toUser.getId());
                AuditResponse audit = recordAudit(
                        AuditAction.TRANSFER,
                        fromUser,
                        List.of(savedFrom.getId(), savedTo.getId()),
                        involvedUsers,
                        normalizedAmount,
                        List.of(withdrawal, deposit));
                return new TransferResponse(
                        savedFrom.getId(),
                        savedTo.getId(),
                        normalizedAmount,
                        savedFrom.getBalance(),
                        savedTo.getBalance(),
                        audit.id(),
                        when
                );
            }
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
     * Stores the history row after the account save. The save participates
     * in the transaction started by deposit, withdraw, or transfer.
     */
    private Transaction recordTransaction(String accountId, TransactionType type, BigDecimal amount) {
        return transactionRepository.save(new Transaction(accountId, type, amount, LocalDateTime.now()));
    }

    private AuditResponse recordAudit(AuditAction action,
                                      User user,
                                      List<String> accountIds,
                                      List<String> involvedUserIds,
                                      BigDecimal amount,
                                      List<Transaction> transactions) {
        LocalDateTime createdAt = transactions.get(0).getCreatedAt();
        return auditService.record(new AuditRecord(
                action,
                user.getId(),
                accountIds,
                involvedUserIds,
                amount,
                transactionIds(transactions),
                createdAt
        ));
    }

    private List<String> transactionIds(List<Transaction> transactions) {
        List<String> ids = new ArrayList<>();
        for (Transaction transaction : transactions) {
            if (transaction.getId() != null) {
                ids.add(transaction.getId());
            }
        }
        return List.copyOf(ids);
    }

    /**
     * A premium threshold may be zero. A negative value, or more than two
     * decimal places, is rejected before MongoDB is queried.
     */
    private BigDecimal requireThreshold(BigDecimal threshold) {
        if (threshold == null) {
            throw new InvalidTransactionException("Threshold is required");
        }
        if (threshold.scale() > MONEY_SCALE) {
            throw new InvalidTransactionException("Threshold must have at most 2 decimal places");
        }
        BigDecimal normalized = scale(threshold);
        if (normalized.compareTo(BigDecimal.ZERO) < 0) {
            throw new InvalidTransactionException("Threshold must be zero or greater");
        }
        return normalized;
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
