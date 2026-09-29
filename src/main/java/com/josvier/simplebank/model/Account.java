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

    private Long id;
    private final Long userId;
    private BigDecimal balance;
    private final AccountType accountType;
    private final LocalDateTime createdAt;

    public Account(Long userId, BigDecimal balance, AccountType accountType, LocalDateTime createdAt) {
        this.userId = userId;
        this.balance = balance;
        this.accountType = accountType;
        this.createdAt = createdAt;
    }

    public void setId(Long id) {
        this.id = id;
    }

    /**
     * Replaces the balance only after the service has accepted the operation.
     * The service must not call this until every check has passed.
     */
    public void setBalance(BigDecimal balance) {
        this.balance = balance;
    }

    public Account copy() {
        Account copy = new Account(userId, balance, accountType, createdAt);
        copy.setId(id);
        return copy;
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
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
