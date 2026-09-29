package com.josvier.simplebank.controller;

import com.josvier.simplebank.dto.response.UserResponse;
import com.josvier.simplebank.exception.DuplicateResourceException;
import com.josvier.simplebank.exception.GlobalExceptionHandler;
import com.josvier.simplebank.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
@Import(GlobalExceptionHandler.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserService userService;

    @Test
    void createUser_returnsCreated() throws Exception {
        when(userService.createUser(any())).thenReturn(
                new UserResponse(1L, "Josvier Rodriguez", "josvier@example.com", LocalDateTime.of(2026, 9, 29, 10, 0)));

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Josvier Rodriguez","email":"josvier@example.com"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Josvier Rodriguez"))
                .andExpect(jsonPath("$.email").value("josvier@example.com"));
    }

    @Test
    void getUser_returnsOk() throws Exception {
        when(userService.getUser(1L)).thenReturn(
                new UserResponse(1L, "Josvier Rodriguez", "josvier@example.com", LocalDateTime.of(2026, 9, 29, 10, 0)));

        mockMvc.perform(get("/api/users/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
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
}
