package com.josvier.simplebank.security.jwt;

import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtServiceTest {

    private static final String TEST_SECRET = "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=";
    private static final Clock ISSUED_AT = Clock.fixed(Instant.parse("2026-09-30T15:00:00Z"), ZoneOffset.UTC);

    private final JwtService jwtService = new JwtService(TEST_SECRET, 3_600_000, ISSUED_AT);

    @Test
    void generatedToken_containsUsername() {
        String token = jwtService.generateToken(user("ada"));

        assertEquals("ada", jwtService.extractUsername(token));
    }

    @Test
    void generatedToken_containsRoles() {
        String token = jwtService.generateToken(user("ada"));

        assertTrue(jwtService.extractRoles(token).contains("ROLE_USER"));
    }

    @Test
    void validToken_isAccepted() {
        UserDetails ada = user("ada");

        assertTrue(jwtService.validateToken(jwtService.generateToken(ada), ada));
    }

    @Test
    void expiredToken_isRejected() {
        UserDetails ada = user("ada");
        String token = jwtService.generateToken(ada);
        JwtService later = new JwtService(TEST_SECRET, 3_600_000, Clock.offset(ISSUED_AT, Duration.ofHours(2)));

        assertFalse(later.validateToken(token, ada));
    }

    @Test
    void tamperedToken_isRejected() {
        UserDetails ada = user("ada");
        String token = jwtService.generateToken(ada);
        String tampered = token.substring(0, token.length() - 2) + (token.endsWith("a") ? "b" : "a");

        assertFalse(jwtService.validateToken(tampered, ada));
    }

    @Test
    void tokenForDifferentUser_isRejected() {
        String token = jwtService.generateToken(user("ada"));

        assertFalse(jwtService.validateToken(token, user("grace")));
    }

    @Test
    void generatedToken_containsJti() {
        String token = jwtService.generateToken(user("ada"));

        assertFalse(jwtService.extractJti(token).isBlank());
    }

    @Test
    void invalidBase64Secret_failsFast() {
        IllegalStateException exception = assertThrows(IllegalStateException.class,
                () -> new JwtService("not-valid-base64!!!", 3_600_000, ISSUED_AT));

        assertEquals("JWT_SECRET must be Base64", exception.getMessage());
    }

    @Test
    void secretShorterThan256Bits_failsFast() {
        String shortSecret = java.util.Base64.getEncoder().encodeToString(
                "0123456789abcdef".getBytes(java.nio.charset.StandardCharsets.US_ASCII));

        IllegalStateException exception = assertThrows(IllegalStateException.class,
                () -> new JwtService(shortSecret, 3_600_000, ISSUED_AT));

        assertEquals("JWT_SECRET must decode to at least 256 bits", exception.getMessage());
    }

    @Test
    void nonPositiveExpiration_failsFast() {
        assertThrows(IllegalStateException.class, () -> new JwtService(TEST_SECRET, 0, ISSUED_AT));
        assertThrows(IllegalStateException.class, () -> new JwtService(TEST_SECRET, -1, ISSUED_AT));
    }

    private static UserDetails user(String username) {
        return User.withUsername(username)
                .password("stored-hash")
                .authorities("ROLE_USER")
                .build();
    }
}
