package com.josvier.simplebank.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * One successful deposit or withdrawal.
 *
 * Created only after the account update is accepted. A rejected withdrawal
 * or an invalid amount must leave this history unchanged.
 */
public class Transaction {

    private String id;
    private final String accountId;
    private final TransactionType type;
    private final BigDecimal amount;
    private final LocalDateTime createdAt;

    public Transaction(String accountId, TransactionType type, BigDecimal amount, LocalDateTime createdAt) {
        this.accountId = accountId;
        this.type = type;
        this.amount = amount;
        this.createdAt = createdAt;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getId() {
        return id;
    }

    public String getAccountId() {
        return accountId;
    }

    public TransactionType getType() {
        return type;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
