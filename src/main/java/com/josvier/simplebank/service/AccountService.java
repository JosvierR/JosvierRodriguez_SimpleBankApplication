package com.josvier.simplebank.service;

import com.josvier.simplebank.dto.request.CreateAccountRequest;
import com.josvier.simplebank.dto.request.CustomerTransferRequest;
import com.josvier.simplebank.dto.request.TransferRequest;
import com.josvier.simplebank.dto.request.UpdateAccountRequest;
import com.josvier.simplebank.dto.response.AccountResponse;
import com.josvier.simplebank.dto.response.CustomerTransferReceiptResponse;
import com.josvier.simplebank.dto.response.TransactionResponse;
import com.josvier.simplebank.dto.response.TransferPreviewResponse;
import com.josvier.simplebank.dto.response.TransferResponse;

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
    AccountResponse getAccount(String accountId);

    /**
     * Returns every account, including each owner's name.
     */
    List<AccountResponse> getAccounts();

    /**
     * Returns the accounts owned by one user. An existing user with no accounts gets an empty list.
     *
     * @throws com.josvier.simplebank.exception.ResourceNotFoundException if the user does not exist
     */
    List<AccountResponse> getAccountsByUser(String userId);

    /**
     * Returns accounts whose balance is greater than or equal to the threshold.
     * The comparison runs in MongoDB. An empty result is a successful empty list.
     *
     * @throws com.josvier.simplebank.exception.InvalidTransactionException if the threshold is negative or has more than 2 decimal places
     */
    List<AccountResponse> getPremiumAccounts(BigDecimal threshold);

    /**
     * Replaces the account type. The id, owner, balance, and creation time stay the same.
     *
     * @throws com.josvier.simplebank.exception.ResourceNotFoundException if the account does not exist
     */
    AccountResponse updateAccount(String accountId, UpdateAccountRequest request);

    /**
     * Deletes an account that has no transaction history.
     *
     * @throws com.josvier.simplebank.exception.ResourceNotFoundException if the account does not exist
     * @throws com.josvier.simplebank.exception.ResourceConflictException if the account already has transactions
     */
    void deleteAccount(String accountId);

    /**
     * Moves money from one account to another and records one audit trace for both accounts.
     *
     * @throws com.josvier.simplebank.exception.ResourceNotFoundException if either account does not exist
     * @throws com.josvier.simplebank.exception.InvalidTransactionException if the accounts are the same, the amount is invalid, or funds are insufficient
     */
    TransferResponse transfer(TransferRequest request);

    /**
     * Confirms an internal transfer without moving money.
     * The destination is resolved only by its public account number.
     */
    TransferPreviewResponse previewCustomerTransfer(CustomerTransferRequest request);

    /**
     * Moves money from an owned account to any account in this bank
     * identified by its public account number.
     */
    CustomerTransferReceiptResponse submitCustomerTransfer(CustomerTransferRequest request);

    /**
     * Adds a positive amount to the account and records one DEPOSIT transaction.
     *
     * @throws com.josvier.simplebank.exception.ResourceNotFoundException if the account does not exist
     * @throws com.josvier.simplebank.exception.InvalidTransactionException if the amount is not positive
     */
    AccountResponse deposit(String accountId, BigDecimal amount);

    /**
     * Removes a positive amount when the balance can cover it and records one WITHDRAW transaction.
     * Insufficient funds leaves the balance and the history unchanged.
     *
     * @throws com.josvier.simplebank.exception.ResourceNotFoundException if the account does not exist
     * @throws com.josvier.simplebank.exception.InvalidTransactionException if the amount is not positive or funds are insufficient
     */
    AccountResponse withdraw(String accountId, BigDecimal amount);

    /**
     * Returns the account's transactions from oldest to newest.
     *
     * @throws com.josvier.simplebank.exception.ResourceNotFoundException if the account does not exist
     */
    List<TransactionResponse> getTransactions(String accountId);
}
