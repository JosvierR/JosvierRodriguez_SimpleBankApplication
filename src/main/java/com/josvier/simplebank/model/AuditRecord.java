package com.josvier.simplebank.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * One compliance trace for a successful deposit, withdrawal, or transfer.
 *
 * It records the bank customer whose money moved and, when the call was
 * authenticated, the API login that executed the operation. Older documents
 * may omit the actor fields. Those stay null when they are read.
 */
public class AuditRecord {

    private String id;
    private final AuditAction action;
    private final String userId;
    private final List<String> accountIds;
    private final List<String> involvedUserIds;
    private final BigDecimal amount;
    private final List<String> transactionIds;
    private final LocalDateTime createdAt;
    private final String actorAuthUserId;
    private final String actorUsername;

    public AuditRecord(AuditAction action,
                       String userId,
                       List<String> accountIds,
                       List<String> involvedUserIds,
                       BigDecimal amount,
                       List<String> transactionIds,
                       LocalDateTime createdAt,
                       String actorAuthUserId,
                       String actorUsername) {
        this.action = action;
        this.userId = userId;
        this.accountIds = copy(accountIds);
        this.involvedUserIds = copy(involvedUserIds);
        this.amount = amount;
        this.transactionIds = copy(transactionIds);
        this.createdAt = createdAt;
        this.actorAuthUserId = actorAuthUserId;
        this.actorUsername = actorUsername;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getId() {
        return id;
    }

    public AuditAction getAction() {
        return action;
    }

    public String getUserId() {
        return userId;
    }

    public List<String> getAccountIds() {
        return accountIds;
    }

    public List<String> getInvolvedUserIds() {
        return involvedUserIds;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public List<String> getTransactionIds() {
        return transactionIds;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public String getActorAuthUserId() {
        return actorAuthUserId;
    }

    public String getActorUsername() {
        return actorUsername;
    }

    private static List<String> copy(List<String> values) {
        if (values == null || values.isEmpty()) {
            return List.of();
        }
        return List.copyOf(new ArrayList<>(values));
    }
}
