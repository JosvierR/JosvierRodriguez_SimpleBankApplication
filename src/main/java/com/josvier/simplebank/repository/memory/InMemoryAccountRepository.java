package com.josvier.simplebank.repository.memory;

import com.josvier.simplebank.model.Account;
import com.josvier.simplebank.repository.AccountRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Account storage that lives only inside this running application.
 *
 * The map stores a copy on every save and returns a copy on every read.
 * Changing a balance on an object the service is holding does nothing to
 * stored data until {@link #save(Account)} is called. That matches the
 * later database repository, where an update is persisted only when it is saved.
 */
@Repository
public class InMemoryAccountRepository implements AccountRepository {

    private final ConcurrentHashMap<Long, Account> accounts = new ConcurrentHashMap<>();
    private final AtomicLong idSequence = new AtomicLong(0);

    @Override
    public Account save(Account account) {
        if (account.getId() == null) {
            account.setId(idSequence.incrementAndGet());
        }
        accounts.put(account.getId(), account.copy());
        return account;
    }

    @Override
    public Optional<Account> findById(Long id) {
        if (id == null) {
            return Optional.empty();
        }
        return Optional.ofNullable(accounts.get(id)).map(Account::copy);
    }

    @Override
    public List<Account> findAll() {
        return accounts.values().stream()
                .map(Account::copy)
                .toList();
    }
}
