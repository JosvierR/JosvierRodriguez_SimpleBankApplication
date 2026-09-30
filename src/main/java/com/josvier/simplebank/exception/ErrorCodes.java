package com.josvier.simplebank.exception;

import org.springframework.http.HttpStatus;

/**
 * Stable machine codes that sit beside the existing English message.
 * Clients localize from the code and keep the message for debugging.
 */
public final class ErrorCodes {

    private ErrorCodes() {
    }

    public static String from(HttpStatus status, String message) {
        String text = message == null ? "" : message;
        if (text.contains("Invalid username or password")) return "INVALID_CREDENTIALS";
        if (text.contains("Authentication is required") || text.contains("Invalid or expired token")) return "AUTH_REQUIRED";
        if (status == HttpStatus.FORBIDDEN || text.contains("Access is denied")) return "ACCESS_DENIED";
        if (text.contains("Insufficient funds")) return "INSUFFICIENT_FUNDS";
        if (text.contains("transactions still exist")) return "ACCOUNT_HAS_TRANSACTIONS";
        if (text.contains("accounts still exist")) return "CUSTOMER_HAS_ACCOUNTS";
        if (text.contains("enabled administrator is required")) return "LAST_ADMIN_PROTECTED";
        if (text.contains("already has a linked login")) return "CUSTOMER_LINK_CONFLICT";
        if (text.contains("already exists") || text.contains("already belongs")) return "DUPLICATE_RESOURCE";
        if (status == HttpStatus.NOT_FOUND) return "RESOURCE_NOT_FOUND";
        if (status == HttpStatus.CONFLICT) return "CONFLICT";
        if (status == HttpStatus.BAD_REQUEST) return "VALIDATION_ERROR";
        if (status == HttpStatus.UNAUTHORIZED) return "AUTH_REQUIRED";
        return "UNEXPECTED";
    }
}
