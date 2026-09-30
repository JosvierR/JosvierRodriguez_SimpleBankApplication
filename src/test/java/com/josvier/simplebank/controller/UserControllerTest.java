package com.josvier.simplebank.controller;

import com.josvier.simplebank.dto.response.AccountResponse;
import com.josvier.simplebank.dto.response.UserResponse;
import com.josvier.simplebank.exception.DuplicateResourceException;
import com.josvier.simplebank.exception.GlobalExceptionHandler;
import com.josvier.simplebank.exception.ResourceConflictException;
import com.josvier.simplebank.exception.ResourceNotFoundException;
import com.josvier.simplebank.model.AccountType;
import com.josvier.simplebank.service.AccountService;
import com.josvier.simplebank.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
@Import(GlobalExceptionHandler.class)
@WithMockUser
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private AccountService accountService;

    @Test
    void createUser_returnsCreated() throws Exception {
        when(userService.createUser(any())).thenReturn(
                new UserResponse("68dc1234567890abcdef0001", "Josvier Rodriguez", "josvier@example.com", LocalDateTime.of(2026, 9, 29, 10, 0)));

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Josvier Rodriguez","email":"josvier@example.com"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("68dc1234567890abcdef0001"))
                .andExpect(jsonPath("$.name").value("Josvier Rodriguez"))
                .andExpect(jsonPath("$.email").value("josvier@example.com"));
    }

    @Test
    void getUser_returnsOk() throws Exception {
        when(userService.getUser("68dc1234567890abcdef0001")).thenReturn(
                new UserResponse("68dc1234567890abcdef0001", "Josvier Rodriguez", "josvier@example.com", LocalDateTime.of(2026, 9, 29, 10, 0)));

        mockMvc.perform(get("/api/users/68dc1234567890abcdef0001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("68dc1234567890abcdef0001"))
                .andExpect(jsonPath("$.email").value("josvier@example.com"));
    }

    @Test
    void createUser_duplicateEmail_returnsConflict() throws Exception {
        when(userService.createUser(any())).thenThrow(
                new DuplicateResourceException("User with email josvier@example.com already exists"));

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Josvier Rodriguez","email":"josvier@example.com"}
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message").value("User with email josvier@example.com already exists"));
    }

    @Test
    void getUsers_returnsOk() throws Exception {
        when(userService.getUsers()).thenReturn(List.of(
                new UserResponse("68dc1234567890abcdef0001", "Customer One", "customer1@example.com", LocalDateTime.of(2026, 9, 29, 10, 0)),
                new UserResponse("68dc1234567890abcdef0002", "Customer Two", "customer2@example.com", LocalDateTime.of(2026, 9, 29, 10, 1))));

        mockMvc.perform(get("/api/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value("68dc1234567890abcdef0001"))
                .andExpect(jsonPath("$[1].email").value("customer2@example.com"));
    }

    @Test
    void updateUser_returnsOk() throws Exception {
        when(userService.updateUser(any(), any())).thenReturn(
                new UserResponse("68dc1234567890abcdef0001", "Updated Name", "updated@example.com", LocalDateTime.of(2026, 9, 29, 10, 0)));

        mockMvc.perform(put("/api/users/68dc1234567890abcdef0001")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Updated Name","email":"updated@example.com"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("68dc1234567890abcdef0001"))
                .andExpect(jsonPath("$.name").value("Updated Name"))
                .andExpect(jsonPath("$.email").value("updated@example.com"));
    }

    @Test
    void updateUser_invalidBody_returnsBadRequest() throws Exception {
        mockMvc.perform(put("/api/users/68dc1234567890abcdef0001")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":" ","email":"not-an-email"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void updateUser_duplicateEmail_returnsConflict() throws Exception {
        when(userService.updateUser(any(), any())).thenThrow(
                new DuplicateResourceException("User with email customer2@example.com already exists"));

        mockMvc.perform(put("/api/users/68dc1234567890abcdef0001")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Customer One","email":"customer2@example.com"}
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("User with email customer2@example.com already exists"));
    }

    @Test
    void deleteUser_returnsNoContent() throws Exception {
        mockMvc.perform(delete("/api/users/68dc1234567890abcdef0001"))
                .andExpect(status().isNoContent());

        verify(userService).deleteUser("68dc1234567890abcdef0001");
    }

    @Test
    void deleteUser_missing_returnsNotFound() throws Exception {
        org.mockito.Mockito.doThrow(new ResourceNotFoundException("User with id 68dc1234567890abcdef0001 was not found"))
                .when(userService).deleteUser("68dc1234567890abcdef0001");

        mockMvc.perform(delete("/api/users/68dc1234567890abcdef0001"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void deleteUser_withAccounts_returnsConflict() throws Exception {
        org.mockito.Mockito.doThrow(new ResourceConflictException("User cannot be deleted while accounts still exist"))
                .when(userService).deleteUser("68dc1234567890abcdef0001");

        mockMvc.perform(delete("/api/users/68dc1234567890abcdef0001"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("User cannot be deleted while accounts still exist"));
    }

    @Test
    void getAccountsByUser_returnsOk() throws Exception {
        when(accountService.getAccountsByUser("68dc1234567890abcdef0001")).thenReturn(List.of(
                new AccountResponse(
                        "68dc1234567890abcdef0002",
                        "68dc1234567890abcdef0001",
                        "Customer Two",
                        AccountType.SAVINGS,
                        new BigDecimal("0.00"),
                        LocalDateTime.of(2026, 9, 29, 10, 0))));

        mockMvc.perform(get("/api/users/68dc1234567890abcdef0001/accounts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].accountId").value("68dc1234567890abcdef0002"))
                .andExpect(jsonPath("$[0].userId").value("68dc1234567890abcdef0001"));
    }
}
