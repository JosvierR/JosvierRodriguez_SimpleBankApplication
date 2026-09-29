package com.josvier.simplebank.controller;

import com.josvier.simplebank.dto.response.AccountResponse;
import com.josvier.simplebank.dto.response.TransactionResponse;
import com.josvier.simplebank.exception.GlobalExceptionHandler;
import com.josvier.simplebank.exception.InvalidTransactionException;
import com.josvier.simplebank.exception.ResourceNotFoundException;
import com.josvier.simplebank.model.AccountType;
import com.josvier.simplebank.model.TransactionType;
import com.josvier.simplebank.service.AccountService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AccountController.class)
@Import(GlobalExceptionHandler.class)
class AccountControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AccountService accountService;

    @Test
    void createAccount_returnsCreated() throws Exception {
        when(accountService.createAccount(any())).thenReturn(account(new BigDecimal("0.00")));

        mockMvc.perform(post("/api/accounts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"userId":1,"accountType":"SAVINGS"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accountId").value(1))
                .andExpect(jsonPath("$.userId").value(1))
                .andExpect(jsonPath("$.userName").value("Josvier Rodriguez"))
                .andExpect(jsonPath("$.accountType").value("SAVINGS"))
                .andExpect(jsonPath("$.balance").value(0));
    }

    @Test
    void getAccount_returnsOk() throws Exception {
        when(accountService.getAccount(1L)).thenReturn(account(new BigDecimal("550.00")));

        mockMvc.perform(get("/api/accounts/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accountId").value(1))
                .andExpect(jsonPath("$.balance").value(550.00));
    }

    @Test
    void getAccount_missing_returnsNotFound() throws Exception {
        when(accountService.getAccount(999L)).thenThrow(
                new ResourceNotFoundException("Account with id 999 was not found"));

        mockMvc.perform(get("/api/accounts/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value("Account with id 999 was not found"))
                .andExpect(jsonPath("$.path").value("/api/accounts/999"));
    }

    @Test
    void deposit_returnsOk() throws Exception {
        when(accountService.deposit(eq(1L), any(BigDecimal.class))).thenReturn(account(new BigDecimal("500.00")));

        mockMvc.perform(post("/api/accounts/1/deposit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"amount":500.00}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.balance").value(500.00));
    }

    @Test
    void deposit_invalidAmount_returnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/accounts/1/deposit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"amount":0}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("amount: Amount must be at least 0.01"));

        mockMvc.perform(post("/api/accounts/1/deposit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"amount":-100}
                                """))
                .andExpect(status().isBadRequest());

        verify(accountService, never()).deposit(any(), any());
    }

    @Test
    void deposit_moreThanTwoDecimalPlaces_returnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/accounts/1/deposit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"amount":10.126}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("amount: Amount must have at most 2 decimal places"))
                .andExpect(jsonPath("$.path").value("/api/accounts/1/deposit"));

        verify(accountService, never()).deposit(any(), any());
    }

    @Test
    void deposit_acceptsUpToTwoDecimalPlaces() throws Exception {
        when(accountService.deposit(eq(1L), any(BigDecimal.class))).thenReturn(account(new BigDecimal("10.12")));

        for (String amount : new String[] {"10.12", "10", "0.01"}) {
            mockMvc.perform(post("/api/accounts/1/deposit")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"amount\":" + amount + "}"))
                    .andExpect(status().isOk());
        }
    }

    @Test
    void withdraw_returnsOk() throws Exception {
        when(accountService.withdraw(eq(1L), any(BigDecimal.class))).thenReturn(account(new BigDecimal("300.00")));

        mockMvc.perform(post("/api/accounts/1/withdraw")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"amount":200.00}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.balance").value(300.00));
    }

    @Test
    void withdraw_insufficientFunds_returnsBadRequest() throws Exception {
        when(accountService.withdraw(eq(1L), any(BigDecimal.class)))
                .thenThrow(new InvalidTransactionException("Insufficient funds"));

        mockMvc.perform(post("/api/accounts/1/withdraw")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"amount":1000}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Insufficient funds"));
    }

    @Test
    void getTransactions_returnsOk() throws Exception {
        when(accountService.getTransactions(1L)).thenReturn(List.of(
                new TransactionResponse(1L, 1L, TransactionType.DEPOSIT, new BigDecimal("500.00"),
                        LocalDateTime.of(2026, 9, 29, 10, 0)),
                new TransactionResponse(2L, 1L, TransactionType.WITHDRAW, new BigDecimal("200.00"),
                        LocalDateTime.of(2026, 9, 29, 11, 0))
        ));

        mockMvc.perform(get("/api/accounts/1/transactions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].transactionId").value(1))
                .andExpect(jsonPath("$[0].type").value("DEPOSIT"))
                .andExpect(jsonPath("$[0].amount").value(500.00))
                .andExpect(jsonPath("$[1].type").value("WITHDRAW"))
                .andExpect(jsonPath("$[1].amount").value(200.00));
    }

    @Test
    void unknownPath_returnsNotFound() throws Exception {
        mockMvc.perform(get("/api"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value("No endpoint matches this path"))
                .andExpect(jsonPath("$.path").value("/api"));
    }

    private AccountResponse account(BigDecimal balance) {
        return new AccountResponse(
                1L,
                1L,
                "Josvier Rodriguez",
                AccountType.SAVINGS,
                balance,
                LocalDateTime.of(2026, 9, 29, 10, 0)
        );
    }
}
