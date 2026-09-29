package com.josvier.simplebank.model;

/**
 * Kind of bank account a customer can open.
 *
 * Stored as an enum so only these values can exist. The API rejects anything else.
 */
public enum AccountType {
    CHECKING,
    SAVINGS
}
