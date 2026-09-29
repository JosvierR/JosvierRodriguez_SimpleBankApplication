package com.josvier.simplebank.repository.mongo.document;

import com.josvier.simplebank.model.AccountType;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;
import org.springframework.data.mongodb.core.mapping.MongoId;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * MongoDB shape of a bank account.
 *
 * The owner is stored as {@code userId}, not as an embedded user or a DBRef.
 * Existence of that user is a service rule. Balance is {@link BigDecimal} so
 * it can be written as BSON Decimal128 instead of a binary double.
 */
@Document(collection = "accounts")
public class AccountDocument {

    @MongoId(FieldType.OBJECT_ID)
    private String id;

    @Indexed(name = "user_id_idx")
    private String userId;

    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal balance;

    private AccountType accountType;

    private LocalDateTime createdAt;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public BigDecimal getBalance() {
        return balance;
    }

    public void setBalance(BigDecimal balance) {
        this.balance = balance;
    }

    public AccountType getAccountType() {
        return accountType;
    }

    public void setAccountType(AccountType accountType) {
        this.accountType = accountType;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
