package com.josvier.simplebank.security;

import com.josvier.simplebank.auth.model.AuthRole;
import com.josvier.simplebank.auth.model.AuthUser;
import com.josvier.simplebank.auth.repository.AuthUserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Loads the real security filter chain and Springdoc.
 *
 * The auth user repository is mocked and Mongo is pointed at a closed port,
 * so these checks do not use Atlas.
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.mongodb.uri=mongodb://127.0.0.1:1/simple_bank?serverSelectionTimeoutMS=200",
        "spring.data.mongodb.auto-index-creation=false"
})
class SecurityWebIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockitoBean
    private AuthUserRepository authUsers;

    @Test
    void registerAndLogin_areNotRejectedAsUnauthenticated() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"ada","email":"not-an-email","password":"short"}
                                """))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"","password":""}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void browserOriginIsAllowedWhenNoRemoteOriginsAreConfigured() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .header("Origin", "http://localhost:3000")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"","password":""}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void protectedRoute_withoutJwt_returnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/accounts"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void protectedRoute_withJwt_isNotRejectedBySecurity() throws Exception {
        AuthUser ada = new AuthUser(
                "ada",
                "ada@example.com",
                passwordEncoder.encode("password123"),
                Set.of(AuthRole.USER),
                true,
                LocalDateTime.of(2026, 9, 30, 15, 0)
        );
        when(authUsers.findByUsername("ada")).thenReturn(Optional.of(ada));

        String token = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"ada","password":"password123"}
                                """))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        String jwt = token.replaceAll(".*\"token\"\\s*:\\s*\"([^\"]+)\".*", "$1");

        mockMvc.perform(get("/api/auth/verify").header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("ada"));
    }

    @Test
    void readiness_withoutJwt_reportsDownWhenMongoIsUnreachable() throws Exception {
        String body = mockMvc.perform(get("/api/public/ready"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.status").value("DOWN"))
                .andExpect(jsonPath("$.environment").value("local"))
                .andExpect(jsonPath("$.revision").value("local"))
                .andReturn()
                .getResponse()
                .getContentAsString();
        assertFalse(body.contains("mongodb"));
        assertFalse(body.contains("127.0.0.1"));
        assertFalse(body.contains("MDEyMzQ1"));
    }

    @Test
    void swagger_isAccessibleWithoutJwt() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk());
        mockMvc.perform(get("/swagger-ui/index.html"))
                .andExpect(status().isOk());
    }
}
