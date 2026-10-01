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
    private String transferReference;
    private String counterpartyAccountNumberMasked;
    private String counterpartyDisplayName;

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

    public void setTransferReference(String transferReference) {
        this.transferReference = transferReference;
    }

    public void setCounterpartyAccountNumberMasked(String counterpartyAccountNumberMasked) {
        this.counterpartyAccountNumberMasked = counterpartyAccountNumberMasked;
    }

    public void setCounterpartyDisplayName(String counterpartyDisplayName) {
        this.counterpartyDisplayName = counterpartyDisplayName;
    }

    public String getTransferReference() {
        return transferReference;
    }

    public String getCounterpartyAccountNumberMasked() {
        return counterpartyAccountNumberMasked;
    }

    public String getCounterpartyDisplayName() {
        return counterpartyDisplayName;
    }
}
