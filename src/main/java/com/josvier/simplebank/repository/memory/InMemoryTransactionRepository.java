package com.josvier.simplebank.repository.memory;

import com.josvier.simplebank.model.Transaction;
import com.josvier.simplebank.repository.TransactionRepository;
import org.springframework.stereotype.Repository;

import java.util.Comparator;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Transaction storage that lives only inside this running application.
 *
 * A {@link ConcurrentHashMap} does not keep insertion order. Ids come from
 * an {@link AtomicLong}, so sorting by id restores the order in which
 * successful operations were recorded.
 */
@Repository
public class InMemoryTransactionRepository implements TransactionRepository {

    private final ConcurrentHashMap<Long, Transaction> transactions = new ConcurrentHashMap<>();
    private final AtomicLong idSequence = new AtomicLong(0);

    @Override
    public Transaction save(Transaction transaction) {
        if (transaction.getId() == null) {
            transaction.setId(idSequence.incrementAndGet());
        }
        transactions.put(transaction.getId(), transaction.copy());
        return transaction;
    }

    @Override
    public List<Transaction> findByAccountId(Long accountId) {
        if (accountId == null) {
            return List.of();
        }
        return transactions.values().stream()
                .filter(transaction -> accountId.equals(transaction.getAccountId()))
                .sorted(Comparator.comparing(Transaction::getId))
                .map(Transaction::copy)
                .toList();
    }
}
