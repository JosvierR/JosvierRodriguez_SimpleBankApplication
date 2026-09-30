package com.josvier.simplebank.security;

import com.josvier.simplebank.auth.controller.AuthController;
import com.josvier.simplebank.auth.dto.response.AuthResponse;
import com.josvier.simplebank.auth.exception.InvalidCredentialsException;
import com.josvier.simplebank.auth.model.AuthRole;
import com.josvier.simplebank.auth.model.AuthUser;
import com.josvier.simplebank.auth.repository.AuthUserRepository;
import com.josvier.simplebank.auth.service.AuthService;
import com.josvier.simplebank.controller.AccountController;
import com.josvier.simplebank.controller.AuditController;
import com.josvier.simplebank.controller.UserController;
import com.josvier.simplebank.exception.DuplicateResourceException;
import com.josvier.simplebank.exception.GlobalExceptionHandler;
import com.josvier.simplebank.security.config.SecurityConfiguration;
import com.josvier.simplebank.security.filter.JwtAuthenticationFilter;
import com.josvier.simplebank.security.filter.SecurityErrorWriter;
import com.josvier.simplebank.security.jwt.JwtService;
import com.josvier.simplebank.security.service.CustomUserDetailsService;
import com.josvier.simplebank.service.AccountService;
import com.josvier.simplebank.service.AuditService;
import com.josvier.simplebank.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@TestPropertySource(properties = "spring.main.allow-bean-definition-overriding=true")
@WebMvcTest(controllers = {
        AuthController.class,
        UserController.class,
        AccountController.class,
        AuditController.class
})
@Import({
        SecurityConfiguration.class,
        JwtService.class,
        CustomUserDetailsService.class,
        SecurityErrorWriter.class,
        GlobalExceptionHandler.class,
        ApiSecurityTest.TestClockConfig.class
})
class ApiSecurityTest {

    @Autowired
    private org.springframework.test.web.servlet.MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private MutableClock clock;

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private AuthUserRepository authUsers;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private AccountService accountService;

    @MockitoBean
    private AuditService auditService;

    @Test
    void register_isPublic() throws Exception {
        when(authService.register(any())).thenReturn(
                new AuthResponse("issued-token", "Bearer", 3600, "ada", List.of("USER")));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"ada","email":"ada@example.com","password":"password123"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.roles[0]").value("USER"))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    @Test
    void login_isPublic() throws Exception {
        when(authService.login(any())).thenReturn(
                new AuthResponse("issued-token", "Bearer", 3600, "ada", List.of("USER")));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"ada","password":"password123"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tokenType").value("Bearer"));
    }

    @Test
    void register_invalidPassword_returnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"ada","email":"ada@example.com","password":"short"}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void register_duplicateUsername_returnsConflict() throws Exception {
        when(authService.register(any())).thenThrow(new DuplicateResourceException("Username already exists"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"ada","email":"ada@example.com","password":"password123"}
                                """))
                .andExpect(status().isConflict());
    }

    @Test
    void login_badPassword_returnsUnauthorized() throws Exception {
        when(authService.login(any())).thenThrow(new InvalidCredentialsException());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"ada","password":"wrong-password"}
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.message").value("Invalid username or password"));
    }

    @Test
    void getUsers_withoutToken_returnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/users"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.message").value("Authentication is required"));
    }

    @Test
    void getAccounts_withoutToken_returnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/accounts"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getAudits_withoutToken_returnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/audits"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getUsers_withToken_reachesController() throws Exception {
        when(authUsers.findByUsername("ada")).thenReturn(Optional.of(ada()));
        when(userService.getUsers()).thenReturn(List.of());

        mockMvc.perform(get("/api/users").header("Authorization", "Bearer " + tokenForAda()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void verify_withToken_returnsOk() throws Exception {
        when(authUsers.findByUsername("ada")).thenReturn(Optional.of(ada()));

        mockMvc.perform(get("/api/auth/verify").header("Authorization", "Bearer " + tokenForAda()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("ada"))
                .andExpect(jsonPath("$.roles[0]").value("USER"));
    }

    @Test
    void invalidBearerToken_returnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/users").header("Authorization", "Bearer not-a-token"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid or expired token"))
                .andExpect(jsonPath("$.trace").doesNotExist());
    }

    @Test
    void expiredToken_returnsUnauthorized() throws Exception {
        when(authUsers.findByUsername("ada")).thenReturn(Optional.of(ada()));
        String token = tokenForAda();
        clock.advance(Duration.ofHours(2));

        mockMvc.perform(get("/api/users").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid or expired token"));
    }

    @Test
    void swagger_isPublic() throws Exception {
        mockMvc.perform(get("/swagger-ui/index.html")).andExpect(status().isNotFound());
        mockMvc.perform(get("/v3/api-docs")).andExpect(status().isNotFound());
    }

    private String tokenForAda() {
        return jwtService.generateToken(userDetailsService.loadUserByUsername("ada"));
    }

    private static AuthUser ada() {
        return new AuthUser(
                "ada",
                "ada@example.com",
                "stored-hash",
                Set.of(AuthRole.USER),
                true,
                LocalDateTime.of(2026, 9, 30, 15, 0)
        );
    }

    static final class MutableClock extends Clock {

        private Instant instant = Instant.parse("2026-09-30T15:00:00Z");

        void advance(Duration duration) {
            instant = instant.plus(duration);
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return instant;
        }
    }

    @org.springframework.boot.test.context.TestConfiguration
    static class TestClockConfig {

        @Bean
        @Primary
        MutableClock clock() {
            return new MutableClock();
        }
    }
}
