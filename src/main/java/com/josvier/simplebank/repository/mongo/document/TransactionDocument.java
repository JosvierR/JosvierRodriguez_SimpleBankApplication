package com.josvier.simplebank.repository.mongo.document;

import com.josvier.simplebank.model.TransactionType;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;
import org.springframework.data.mongodb.core.mapping.MongoId;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * MongoDB shape of one successful money movement.
 *
 * Transactions live in their own collection. Embedding them inside the
 * account document would make that document grow without a bound. The
 * compound index matches the history query: one account, oldest first.
 */
@Document(collection = "transactions")
@CompoundIndex(name = "account_created_at_idx", def = "{'accountId': 1, 'createdAt': 1}")
public class TransactionDocument {

    @MongoId(FieldType.OBJECT_ID)
    private String id;

    private String accountId;

    private TransactionType type;

    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal amount;

    private LocalDateTime createdAt;

    private String transferReference;

    private String counterpartyAccountNumberMasked;

    private String counterpartyDisplayName;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getAccountId() {
        return accountId;
    }

    public void setAccountId(String accountId) {
        this.accountId = accountId;
    }

    public TransactionType getType() {
        return type;
    }

    public void setType(TransactionType type) {
        this.type = type;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getTransferReference() {
        return transferReference;
    }

    public void setTransferReference(String transferReference) {
        this.transferReference = transferReference;
    }

    public String getCounterpartyAccountNumberMasked() {
        return counterpartyAccountNumberMasked;
    }

    public void setCounterpartyAccountNumberMasked(String counterpartyAccountNumberMasked) {
        this.counterpartyAccountNumberMasked = counterpartyAccountNumberMasked;
    }

    public String getCounterpartyDisplayName() {
        return counterpartyDisplayName;
    }

    public void setCounterpartyDisplayName(String counterpartyDisplayName) {
        this.counterpartyDisplayName = counterpartyDisplayName;
    }
}
