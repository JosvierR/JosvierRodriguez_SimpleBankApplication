package com.josvier.simplebank.repository.mongo.document;

import com.josvier.simplebank.auth.repository.mongo.document.AuthUserDocument;
import com.josvier.simplebank.service.impl.AccountServiceImpl;
import org.junit.jupiter.api.Test;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;
import org.springframework.data.mongodb.core.mapping.MongoId;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Method;
import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MongoDocumentMappingTest {

    @Test
    void collectionsAndEmailUniqueIndexAreDeclared() throws Exception {
        assertEquals("users", UserDocument.class.getAnnotation(Document.class).collection());
        assertEquals("accounts", AccountDocument.class.getAnnotation(Document.class).collection());
        assertEquals("transactions", TransactionDocument.class.getAnnotation(Document.class).collection());
        assertEquals("audits", AuditDocument.class.getAnnotation(Document.class).collection());
        assertEquals("auth_users", AuthUserDocument.class.getAnnotation(Document.class).collection());

        Indexed username = AuthUserDocument.class.getDeclaredField("username").getAnnotation(Indexed.class);
        assertTrue(username.unique());
        assertEquals("auth_username_unique_idx", username.name());
        Indexed authEmail = AuthUserDocument.class.getDeclaredField("email").getAnnotation(Indexed.class);
        assertTrue(authEmail.unique());
        assertEquals("auth_email_unique_idx", authEmail.name());

        Indexed email = UserDocument.class.getDeclaredField("email").getAnnotation(Indexed.class);
        assertTrue(email.unique());
        assertEquals("email_unique_idx", email.name());

        Indexed userId = AccountDocument.class.getDeclaredField("userId").getAnnotation(Indexed.class);
        assertEquals("user_id_idx", userId.name());

        CompoundIndex history = TransactionDocument.class.getAnnotation(CompoundIndex.class);
        assertEquals("account_created_at_idx", history.name());
        assertEquals("{'accountId': 1, 'createdAt': 1}", history.def());
    }

    @Test
    void primaryIdsUseObjectId() throws Exception {
        assertEquals(FieldType.OBJECT_ID, UserDocument.class.getDeclaredField("id").getAnnotation(MongoId.class).value());
        assertEquals(FieldType.OBJECT_ID, AccountDocument.class.getDeclaredField("id").getAnnotation(MongoId.class).value());
        assertEquals(FieldType.OBJECT_ID, TransactionDocument.class.getDeclaredField("id").getAnnotation(MongoId.class).value());
        assertEquals(FieldType.OBJECT_ID, AuditDocument.class.getDeclaredField("id").getAnnotation(MongoId.class).value());
        assertEquals(FieldType.OBJECT_ID, AuthUserDocument.class.getDeclaredField("id").getAnnotation(MongoId.class).value());
    }

    @Test
    void moneyFieldsUseDecimal128() throws Exception {
        Field balance = AccountDocument.class.getDeclaredField("balance").getAnnotation(Field.class);
        Field amount = TransactionDocument.class.getDeclaredField("amount").getAnnotation(Field.class);
        Field auditAmount = AuditDocument.class.getDeclaredField("amount").getAnnotation(Field.class);
        assertEquals(FieldType.DECIMAL128, balance.targetType());
        assertEquals(FieldType.DECIMAL128, amount.targetType());
        assertEquals(FieldType.DECIMAL128, auditAmount.targetType());
    }

    @Test
    void depositAndWithdrawAreTransactional() throws Exception {
        Method deposit = AccountServiceImpl.class.getMethod("deposit", String.class, BigDecimal.class);
        Method withdraw = AccountServiceImpl.class.getMethod("withdraw", String.class, BigDecimal.class);
        Method transfer = AccountServiceImpl.class.getMethod("transfer", com.josvier.simplebank.dto.request.TransferRequest.class);
        Method customerTransfer = AccountServiceImpl.class.getMethod(
                "submitCustomerTransfer", com.josvier.simplebank.dto.request.CustomerTransferRequest.class);
        Method read = AccountServiceImpl.class.getMethod("getAccount", String.class);

        assertNotNull(deposit.getAnnotation(Transactional.class));
        assertNotNull(withdraw.getAnnotation(Transactional.class));
        assertNotNull(transfer.getAnnotation(Transactional.class));
        assertNotNull(customerTransfer.getAnnotation(Transactional.class));
        assertNull(read.getAnnotation(Transactional.class));
    }
}
