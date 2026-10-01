package com.josvier.simplebank.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.TestPropertySource;
import org.hamcrest.Matchers;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.mongodb.uri=mongodb://127.0.0.1:1/simple_bank?serverSelectionTimeoutMS=200",
        "spring.data.mongodb.auto-index-creation=false",
        "cors.allowed-origins=https://simple-bank-staging.vercel.app, https://simple-bank.vercel.app, *.vercel.app"
})
class CorsConfigurationTest {

    private static final String STAGING = "https://simple-bank-staging.vercel.app";
    private static final String PRODUCTION = "https://simple-bank.vercel.app";

    @Autowired
    private MockMvc mockMvc;

    @Test
    void allowedStagingOriginReceivesTheCorsHeader() throws Exception {
        mockMvc.perform(get("/api/public/health").header(HttpHeaders.ORIGIN, STAGING))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, STAGING))
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.environment").value("local"));
    }

    @Test
    void allowedProductionOriginReceivesTheCorsHeader() throws Exception {
        mockMvc.perform(get("/api/public/config").header(HttpHeaders.ORIGIN, PRODUCTION))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, PRODUCTION))
                .andExpect(jsonPath("$.environment").value("local"));
    }

    @Test
    void unknownOriginAndWildcardAreRejected() throws Exception {
        mockMvc.perform(get("/api/public/health").header(HttpHeaders.ORIGIN, "https://evil.example"))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN));
        mockMvc.perform(options("/api/public/health")
                        .header(HttpHeaders.ORIGIN, "https://preview.vercel.app")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
                .andExpect(header().doesNotExist(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN));
    }

    @Test
    void preflightAllowsAuthorizationForAnExactOrigin() throws Exception {
        mockMvc.perform(options("/api/auth/login")
                        .header(HttpHeaders.ORIGIN, STAGING)
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "Authorization, Content-Type"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, STAGING))
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_HEADERS, Matchers.containsString("Authorization")));
    }
}
