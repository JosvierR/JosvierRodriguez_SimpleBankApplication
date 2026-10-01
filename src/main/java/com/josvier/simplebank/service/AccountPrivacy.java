package com.josvier.simplebank.service;

/**
 * Limited account presentation for transfer confirmation.
 *
 * A transfer preview confirms the destination without opening that account.
 * The customer already typed the public number, so the response shows only
 * the last four digits and a shortened name: first name plus last initial.
 */
public final class AccountPrivacy {

    private AccountPrivacy() {
    }

    public static String mask(String accountNumber) {
        if (accountNumber == null || accountNumber.isBlank()) {
            return "••••";
        }
        String suffix = accountNumber.length() <= 4
                ? accountNumber
                : accountNumber.substring(accountNumber.length() - 4);
        return "•••• " + suffix;
    }

    public static String limitedName(String fullName) {
        if (fullName == null || fullName.isBlank()) {
            return "";
        }
        String[] parts = fullName.trim().split("\\s+");
        if (parts.length == 1) {
            return parts[0];
        }
        return parts[0] + " " + parts[parts.length - 1].charAt(0) + ".";
    }
}
