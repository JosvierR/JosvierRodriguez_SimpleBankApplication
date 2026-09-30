package com.josvier.simplebank.auth.service;

import com.josvier.simplebank.auth.dto.request.LoginRequest;
import com.josvier.simplebank.auth.dto.request.RegisterRequest;
import com.josvier.simplebank.auth.dto.response.AuthResponse;
import com.josvier.simplebank.auth.exception.InvalidCredentialsException;
import com.josvier.simplebank.auth.model.AuthRole;
import com.josvier.simplebank.auth.model.AuthUser;
import com.josvier.simplebank.auth.repository.AuthUserRepository;
import com.josvier.simplebank.auth.service.impl.AuthServiceImpl;
import com.josvier.simplebank.exception.DuplicateResourceException;
import com.josvier.simplebank.security.jwt.JwtService;
import com.josvier.simplebank.security.service.CustomUserDetailsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.lang.reflect.RecordComponent;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    private static final String TEST_SECRET = "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=";
    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-09-30T15:00:00Z"), ZoneOffset.UTC);

    @Mock
    private AuthUserRepository authUsers;

    @Mock
    private AuthenticationManager authenticationManager;

    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final JwtService jwtService = new JwtService(TEST_SECRET, 3_600_000, CLOCK);
    private AuthServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new AuthServiceImpl(
                authUsers,
                passwordEncoder,
                jwtService,
                authenticationManager,
                new CustomUserDetailsService(authUsers),
                CLOCK
        );
    }

    @Test
    void register_success() {
        when(authUsers.save(any(AuthUser.class))).thenAnswer(invocation -> {
            AuthUser user = invocation.getArgument(0);
            user.setId("68dc1234567890abcdef0101");
            return user;
        });

        AuthResponse response = service.register(new RegisterRequest(" ada ", "ada@example.com", "password123"));

        assertEquals("ada", response.username());
        assertEquals("Bearer", response.tokenType());
        assertEquals(3600, response.expiresIn());
        assertEquals(List.of("USER"), response.roles());
        assertEquals("ada", jwtService.extractUsername(response.token()));
    }

    @Test
    void register_hashesPassword() {
        when(authUsers.save(any(AuthUser.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.register(new RegisterRequest("ada", "ada@example.com", "password123"));

        AuthUser saved = savedUser();
        assertNotEquals("password123", saved.getPasswordHash());
        assertFalse(saved.getPasswordHash().contains("password123"));
        assertTrue(passwordEncoder.matches("password123", saved.getPasswordHash()));
    }

    @Test
    void register_defaultsToUserRole() {
        when(authUsers.save(any(AuthUser.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.register(new RegisterRequest("ada", "ada@example.com", "password123"));

        AuthUser saved = savedUser();
        assertEquals(Set.of(AuthRole.USER), saved.getRoles());
        assertTrue(saved.isEnabled());
        assertTrue(Arrays.stream(RegisterRequest.class.getRecordComponents())
                .map(RecordComponent::getName)
                .noneMatch("roles"::equals));
    }

    @Test
    void register_duplicateUsername_returnsConflict() {
        when(authUsers.existsByUsername("ada")).thenReturn(true);

        DuplicateResourceException exception = assertThrows(
                DuplicateResourceException.class,
                () -> service.register(new RegisterRequest("ada", "ada@example.com", "password123")));

        assertEquals("Username already exists", exception.getMessage());
        verify(authUsers, never()).save(any());
    }

    @Test
    void register_duplicateEmail_returnsConflict() {
        when(authUsers.existsByEmail("ada@example.com")).thenReturn(true);

        DuplicateResourceException exception = assertThrows(
                DuplicateResourceException.class,
                () -> service.register(new RegisterRequest("ada", "ada@example.com", "password123")));

        assertEquals("Email already exists", exception.getMessage());
        verify(authUsers, never()).save(any());
    }

    @Test
    void login_success_returnsJwt() {
        AuthUser stored = storedUser();
        when(authenticationManager.authenticate(any())).thenReturn(
                new UsernamePasswordAuthenticationToken("ada", "password123"));
        when(authUsers.findByUsername("ada")).thenReturn(Optional.of(stored));

        AuthResponse response = service.login(new LoginRequest("ada", "password123"));

        assertEquals("Bearer", response.tokenType());
        assertEquals(List.of("USER"), response.roles());
        assertEquals("ada", jwtService.extractUsername(response.token()));
        assertTrue(jwtService.extractRoles(response.token()).contains("ROLE_USER"));
        assertTrue(jwtService.validateToken(response.token(), new CustomUserDetailsService(authUsers).toUserDetails(stored)));
    }

    @Test
    void login_badPassword_returnsUnauthorized() {
        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("bad"));

        assertThrows(InvalidCredentialsException.class,
                () -> service.login(new LoginRequest("ada", "wrong-password")));
    }

    private AuthUser savedUser() {
        ArgumentCaptor<AuthUser> captor = ArgumentCaptor.forClass(AuthUser.class);
        verify(authUsers).save(captor.capture());
        return captor.getValue();
    }

    private AuthUser storedUser() {
        AuthUser user = new AuthUser(
                "ada",
                "ada@example.com",
                passwordEncoder.encode("password123"),
                Set.of(AuthRole.USER),
                true,
                LocalDateTime.now(CLOCK)
        );
        user.setId("68dc1234567890abcdef0101");
        return user;
    }
}
