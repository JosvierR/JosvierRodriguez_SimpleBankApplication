package com.josvier.simplebank.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * A customer's bank account and its current balance.
 *
 * Balance uses {@link BigDecimal} because binary floating point ({@code double}
 * and {@code float}) cannot represent most decimal money amounts exactly.
 */
public class Account {

    private String id;
    private final String userId;
    private BigDecimal balance;
    private AccountType accountType;
    private final LocalDateTime createdAt;

    public Account(String userId, BigDecimal balance, AccountType accountType, LocalDateTime createdAt) {
        this.userId = userId;
        this.balance = balance;
        this.accountType = accountType;
        this.createdAt = createdAt;
    }

    public void setId(String id) {
        this.id = id;
    }

    /**
     * Replaces the balance only after the service has accepted the operation.
     * The service must not call this until every check has passed.
     */
    public void setBalance(BigDecimal balance) {
        this.balance = balance;
    }

    /**
     * Replaces the account type only. The id, owner, balance, and creation time stay as stored.
     */
    public void changeType(AccountType accountType) {
        this.accountType = accountType;
    }

    public String getId() {
        return id;
    }

    public String getUserId() {
        return userId;
    }

    public BigDecimal getBalance() {
        return balance;
    }

    public AccountType getAccountType() {
        return accountType;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
