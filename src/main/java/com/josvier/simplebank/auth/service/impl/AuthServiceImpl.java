package com.josvier.simplebank.auth.service.impl;

import com.josvier.simplebank.auth.dto.request.LoginRequest;
import com.josvier.simplebank.auth.dto.request.RegisterRequest;
import com.josvier.simplebank.auth.dto.response.AuthResponse;
import com.josvier.simplebank.auth.exception.InvalidCredentialsException;
import com.josvier.simplebank.auth.model.AuthRole;
import com.josvier.simplebank.auth.model.AuthUser;
import com.josvier.simplebank.auth.repository.AuthUserRepository;
import com.josvier.simplebank.auth.service.AuthService;
import com.josvier.simplebank.exception.DuplicateResourceException;
import com.josvier.simplebank.security.jwt.JwtService;
import com.josvier.simplebank.security.service.CustomUserDetailsService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Set;

/**
 * Creates {@code USER} logins and asks Spring Security to check passwords.
 *
 * The plaintext password is hashed before save and is not written to the log.
 * Bank customer records are not created here.
 */
@Service
public class AuthServiceImpl implements AuthService {

    private final AuthUserRepository authUsers;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final CustomUserDetailsService userDetailsService;
    private final Clock clock;

    public AuthServiceImpl(AuthUserRepository authUsers,
                           PasswordEncoder passwordEncoder,
                           JwtService jwtService,
                           AuthenticationManager authenticationManager,
                           CustomUserDetailsService userDetailsService,
                           Clock clock) {
        this.authUsers = authUsers;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
        this.clock = clock;
    }

    @Override
    public AuthResponse register(RegisterRequest request) {
        String username = request.username().trim();
        String email = request.email().trim();
        if (authUsers.existsByUsername(username)) {
            throw new DuplicateResourceException("Username already exists");
        }
        if (authUsers.existsByEmail(email)) {
            throw new DuplicateResourceException("Email already exists");
        }
        AuthUser user = new AuthUser(
                username,
                email,
                passwordEncoder.encode(request.password()),
                Set.of(AuthRole.USER),
                true,
                LocalDateTime.now(clock)
        );
        AuthUser saved = authUsers.save(user);
        return tokenResponse(userDetailsService.toUserDetails(saved));
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.username(), request.password()));
        } catch (AuthenticationException exception) {
            throw new InvalidCredentialsException();
        }
        UserDetails principal = userDetailsService.loadUserByUsername(request.username());
        return tokenResponse(principal);
    }

    private AuthResponse tokenResponse(UserDetails principal) {
        return new AuthResponse(
                jwtService.generateToken(principal),
                "Bearer",
                jwtService.getExpirationSeconds(),
                principal.getUsername(),
                CustomUserDetailsService.roleNames(principal)
        );
    }
}
