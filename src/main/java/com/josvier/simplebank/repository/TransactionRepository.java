package com.josvier.simplebank.repository;

import com.josvier.simplebank.model.Transaction;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Storage contract for account transactions.
 *
 * History is queried by account so one customer's activity is not mixed
 * with another account's activity. The implementation returns oldest first.
 */
public interface TransactionRepository {

    Transaction save(Transaction transaction);

    List<Transaction> findByAccountId(String accountId);

    List<Transaction> findByAccountIdInAndCreatedAtBetween(List<String> accountIds,
                                                           LocalDateTime start,
                                                           LocalDateTime end);
}
