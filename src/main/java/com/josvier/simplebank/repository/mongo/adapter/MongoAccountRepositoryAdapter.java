package com.josvier.simplebank.repository.mongo.adapter;

import com.josvier.simplebank.model.Account;
import com.josvier.simplebank.repository.AccountRepository;
import com.josvier.simplebank.repository.mongo.document.AccountDocument;
import com.josvier.simplebank.repository.mongo.springdata.SpringDataAccountMongoRepository;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * Persistence adapter for accounts.
 *
 * Converts between the domain account and the Mongo document. It does not
 * decide whether a withdrawal is allowed or what the next balance should be.
 */
@Repository
public class MongoAccountRepositoryAdapter implements AccountRepository {

    private final SpringDataAccountMongoRepository accounts;

    public MongoAccountRepositoryAdapter(SpringDataAccountMongoRepository accounts) {
        this.accounts = accounts;
    }

    @Override
    public Account save(Account account) {
        return toDomain(accounts.save(toDocument(account)));
    }

    @Override
    public Optional<Account> findById(String id) {
        if (id == null) {
            return Optional.empty();
        }
        return accounts.findById(id).map(this::toDomain);
    }

    @Override
    public Optional<Account> findByIdAndUserId(String id, String userId) {
        if (id == null || userId == null) {
            return Optional.empty();
        }
        return accounts.findByIdAndUserId(id, userId).map(this::toDomain);
    }

    @Override
    public List<Account> findAll() {
        return accounts.findAll().stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public List<Account> findByUserId(String userId) {
        if (userId == null) {
            return List.of();
        }
        return accounts.findByUserId(userId).stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public List<Account> findByBalanceGreaterThanEqual(BigDecimal threshold) {
        if (threshold == null) {
            return List.of();
        }
        return accounts.findByBalanceGreaterThanEqual(threshold).stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public void deleteById(String id) {
        if (id != null) {
            accounts.deleteById(id);
        }
    }

    private AccountDocument toDocument(Account account) {
        AccountDocument document = new AccountDocument();
        document.setId(account.getId());
        document.setUserId(account.getUserId());
        document.setBalance(account.getBalance());
        document.setAccountType(account.getAccountType());
        document.setCreatedAt(account.getCreatedAt());
        return document;
    }

    private Account toDomain(AccountDocument document) {
        Account account = new Account(
                document.getUserId(),
                document.getBalance(),
                document.getAccountType(),
                document.getCreatedAt()
        );
        account.setId(document.getId());
        return account;
    }
}
