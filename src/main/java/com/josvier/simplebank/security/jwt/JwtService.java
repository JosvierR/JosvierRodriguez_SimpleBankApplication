package com.josvier.simplebank.security.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.time.Clock;
import java.util.Date;
import java.util.List;
import java.util.UUID;

/**
 * Signs and checks HMAC SHA-256 access tokens.
 *
 * The signing key comes from {@code JWT_SECRET} as Base64. Role claims are
 * informational. Callers still load the current user before trusting the token.
 */
@Component
public class JwtService {

    static final String ROLES_CLAIM = "roles";

    private final SecretKey key;
    private final long expirationMs;
    private final Clock clock;

    public JwtService(@Value("${security.jwt.secret}") String secret,
                      @Value("${security.jwt.expiration-ms:3600000}") long expirationMs,
                      Clock clock) {
        if (expirationMs <= 0) {
            throw new IllegalStateException("JWT_EXPIRATION_MS must be greater than 0");
        }
        this.key = hmacKey(secret);
        this.expirationMs = expirationMs;
        this.clock = clock;
    }

    public String generateToken(UserDetails userDetails) {
        Date issuedAt = Date.from(clock.instant());
        Date expiration = new Date(issuedAt.getTime() + expirationMs);
        List<String> roles = userDetails.getAuthorities().stream()
                .map(authority -> authority.getAuthority())
                .toList();
        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(userDetails.getUsername())
                .claim(ROLES_CLAIM, roles)
                .issuedAt(issuedAt)
                .expiration(expiration)
                .signWith(key, Jwts.SIG.HS256)
                .compact();
    }

    public String extractJti(String token) {
        return parse(token).getId();
    }

    public String extractUsername(String token) {
        return parse(token).getSubject();
    }

    public Date extractExpiration(String token) {
        return parse(token).getExpiration();
    }

    @SuppressWarnings("unchecked")
    public List<String> extractRoles(String token) {
        Object roles = parse(token).get(ROLES_CLAIM);
        if (roles instanceof List<?> list) {
            return list.stream().map(String::valueOf).toList();
        }
        return List.of();
    }

    public boolean validateToken(String token, UserDetails userDetails) {
        try {
            Claims claims = parse(token);
            return userDetails.getUsername().equals(claims.getSubject()) && userDetails.isEnabled();
        } catch (JwtException | IllegalArgumentException exception) {
            return false;
        }
    }

    public long getExpirationSeconds() {
        return expirationMs / 1000;
    }

    private Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .clock(() -> Date.from(clock.instant()))
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private static SecretKey hmacKey(String secret) {
        final byte[] decoded;
        try {
            decoded = Decoders.BASE64.decode(secret);
        } catch (RuntimeException exception) {
            throw new IllegalStateException("JWT_SECRET must be Base64");
        }
        if (decoded.length < 32) {
            throw new IllegalStateException("JWT_SECRET must decode to at least 256 bits");
        }
        return Keys.hmacShaKeyFor(decoded);
    }
}
