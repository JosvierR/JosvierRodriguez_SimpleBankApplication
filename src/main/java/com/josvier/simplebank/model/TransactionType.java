package com.josvier.simplebank.model;

/**
 * Kind of money movement recorded for an account.
 *
 * A failed operation must not create either type of transaction.
 */
public enum TransactionType {
    DEPOSIT,
    WITHDRAW
}
