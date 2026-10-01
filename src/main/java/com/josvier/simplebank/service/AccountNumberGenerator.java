package com.josvier.simplebank.service;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;

/**
 * Allocates a public 12-digit account number.
 *
 * The value is not a MongoDB id. Uniqueness is enforced by the account
 * collection index; callers retry when a collision is reported.
 */
@Component
public class AccountNumberGenerator {

    private static final long SMALLEST = 100_000_000_000L;
    private static final long SPAN = 900_000_000_000L;

    private final SecureRandom random = new SecureRandom();

    public String next() {
        long value = SMALLEST + Math.floorMod(random.nextLong(), SPAN);
        return Long.toString(value);
    }
}
