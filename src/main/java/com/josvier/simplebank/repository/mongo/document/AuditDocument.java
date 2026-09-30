package com.josvier.simplebank.repository.mongo.document;

import com.josvier.simplebank.model.AuditAction;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;
import org.springframework.data.mongodb.core.mapping.MongoId;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * MongoDB shape of one audit trace.
 *
 * Amount is Decimal128, same as account balances and transaction amounts.
 * Account ids stay strings. They are not a second copy of the ledger.
 */
@Document(collection = "audits")
public class AuditDocument {

    @MongoId(FieldType.OBJECT_ID)
    private String id;

    private AuditAction action;

    private String userId;

    private List<String> accountIds = new ArrayList<>();

    private List<String> involvedUserIds = new ArrayList<>();

    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal amount;

    private List<String> transactionIds = new ArrayList<>();

    @Indexed(name = "audit_created_at_idx")
    private LocalDateTime createdAt;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public AuditAction getAction() {
        return action;
    }

    public void setAction(AuditAction action) {
        this.action = action;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public List<String> getAccountIds() {
        return accountIds;
    }

    public void setAccountIds(List<String> accountIds) {
        this.accountIds = accountIds;
    }

    public List<String> getInvolvedUserIds() {
        return involvedUserIds;
    }

    public void setInvolvedUserIds(List<String> involvedUserIds) {
        this.involvedUserIds = involvedUserIds;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public List<String> getTransactionIds() {
        return transactionIds;
    }

    public void setTransactionIds(List<String> transactionIds) {
        this.transactionIds = transactionIds;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
