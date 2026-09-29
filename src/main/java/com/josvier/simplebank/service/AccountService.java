package com.josvier.simplebank.service;

import com.josvier.simplebank.dto.request.CreateAccountRequest;
import com.josvier.simplebank.dto.response.AccountResponse;
import com.josvier.simplebank.dto.response.TransactionResponse;

import java.math.BigDecimal;
import java.util.List;

/**
 * Banking operations for accounts.
 *
 * Balance rules live behind this interface so HTTP controllers stay thin
 * and the same rules can be tested without starting a web server.
 */
public interface AccountService {

    /**
     * Opens an account with a zero balance for an existing user.
     *
     * @throws com.josvier.simplebank.exception.ResourceNotFoundException if the user does not exist
     */
    AccountResponse createAccount(CreateAccountRequest request);

    /**
     * Returns one account, including the owner's name.
     *
     * @throws com.josvier.simplebank.exception.ResourceNotFoundException if the account or its user does not exist
     */
    AccountResponse getAccount(Long accountId);

    /**
     * Adds a positive amount to the account and records one DEPOSIT transaction.
     *
     * @throws com.josvier.simplebank.exception.ResourceNotFoundException if the account does not exist
     * @throws com.josvier.simplebank.exception.InvalidTransactionException if the amount is not positive
     */
    AccountResponse deposit(Long accountId, BigDecimal amount);

    /**
     * Removes a positive amount when the balance can cover it and records one WITHDRAW transaction.
     * Insufficient funds leaves the balance and the history unchanged.
     *
     * @throws com.josvier.simplebank.exception.ResourceNotFoundException if the account does not exist
     * @throws com.josvier.simplebank.exception.InvalidTransactionException if the amount is not positive or funds are insufficient
     */
    AccountResponse withdraw(Long accountId, BigDecimal amount);

    /**
     * Returns the account's transactions from oldest to newest.
     *
     * @throws com.josvier.simplebank.exception.ResourceNotFoundException if the account does not exist
     */
    List<TransactionResponse> getTransactions(Long accountId);
}
