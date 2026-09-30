package com.josvier.simplebank.repository;

import com.josvier.simplebank.model.Account;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * Storage contract for accounts.
 *
 * The interface is the stable boundary. The Mongo adapter is today's
 * implementation and is the only one registered in this branch.
 */
public interface AccountRepository {

    Account save(Account account);

    Optional<Account> findById(String id);

    Optional<Account> findByIdAndUserId(String id, String userId);

    List<Account> findAll();

    List<Account> findByUserId(String userId);

    List<Account> findByBalanceGreaterThanEqual(BigDecimal threshold);

    void deleteById(String id);
}
