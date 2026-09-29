package com.josvier.simplebank.repository.mongo.adapter;

import com.josvier.simplebank.model.Transaction;
import com.josvier.simplebank.repository.TransactionRepository;
import com.josvier.simplebank.repository.mongo.document.TransactionDocument;
import com.josvier.simplebank.repository.mongo.springdata.SpringDataTransactionMongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Persistence adapter for transaction history.
 *
 * Filtering and oldest-first order are delegated to Spring Data. This class
 * only maps documents. It does not create a history row for a rejected withdrawal.
 */
@Repository
public class MongoTransactionRepositoryAdapter implements TransactionRepository {

    private final SpringDataTransactionMongoRepository transactions;

    public MongoTransactionRepositoryAdapter(SpringDataTransactionMongoRepository transactions) {
        this.transactions = transactions;
    }

    @Override
    public Transaction save(Transaction transaction) {
        return toDomain(transactions.save(toDocument(transaction)));
    }

    @Override
    public List<Transaction> findByAccountId(String accountId) {
        if (accountId == null) {
            return List.of();
        }
        return transactions.findByAccountIdOrderByCreatedAtAscIdAsc(accountId).stream()
                .map(this::toDomain)
                .toList();
    }

    private TransactionDocument toDocument(Transaction transaction) {
        TransactionDocument document = new TransactionDocument();
        document.setId(transaction.getId());
        document.setAccountId(transaction.getAccountId());
        document.setType(transaction.getType());
        document.setAmount(transaction.getAmount());
        document.setCreatedAt(transaction.getCreatedAt());
        return document;
    }

    private Transaction toDomain(TransactionDocument document) {
        Transaction transaction = new Transaction(
                document.getAccountId(),
                document.getType(),
                document.getAmount(),
                document.getCreatedAt()
        );
        transaction.setId(document.getId());
        return transaction;
    }
}
