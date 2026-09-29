package com.josvier.simplebank.repository;

import com.josvier.simplebank.model.Account;

import java.util.List;
import java.util.Optional;

/**
 * Storage contract for accounts.
 *
 * The interface is the stable boundary. {@code InMemoryAccountRepository}
 * is only today's implementation.
 */
public interface AccountRepository {

    Account save(Account account);

    Optional<Account> findById(Long id);

    List<Account> findAll();
}
