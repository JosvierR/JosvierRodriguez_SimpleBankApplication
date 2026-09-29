package com.josvier.simplebank.repository;

import com.josvier.simplebank.model.Transaction;

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
}
