package com.josvier.simplebank.service;

import com.josvier.simplebank.dto.request.CreateUserRequest;
import com.josvier.simplebank.dto.response.UserResponse;
import com.josvier.simplebank.exception.DuplicateResourceException;
import com.josvier.simplebank.exception.ResourceNotFoundException;
import com.josvier.simplebank.model.User;
import com.josvier.simplebank.repository.UserRepository;
import com.josvier.simplebank.service.impl.UserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    private UserService userService;

    @BeforeEach
    void setUp() {
        userService = new UserServiceImpl(userRepository);
    }

    @Test
    void createUser_success() {
        when(userRepository.findByEmail("josvier@example.com")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId("68dc1234567890abcdef0001");
            return user;
        });

        UserResponse response = userService.createUser(
                new CreateUserRequest(" Josvier Rodriguez ", " josvier@example.com "));

        assertEquals("68dc1234567890abcdef0001", response.id());
        assertEquals("Josvier Rodriguez", response.name());
        assertEquals("josvier@example.com", response.email());
        assertNotNull(response.createdAt());
    }

    @Test
    void createUser_duplicateEmail_fails() {
        User existing = new User("Josvier Rodriguez", "josvier@example.com", LocalDateTime.now());
        existing.setId("68dc1234567890abcdef0001");
        when(userRepository.findByEmail("josvier@example.com")).thenReturn(Optional.of(existing));

        CreateUserRequest request = new CreateUserRequest("Another Person", "josvier@example.com");

        DuplicateResourceException exception = assertThrows(
                DuplicateResourceException.class,
                () -> userService.createUser(request));

        assertEquals("User with email josvier@example.com already exists", exception.getMessage());
        verify(userRepository, never()).save(any());
    }

    @Test
    void getUser_success() {
        User user = new User("Josvier Rodriguez", "josvier@example.com", LocalDateTime.of(2026, 9, 29, 10, 0));
        user.setId("68dc1234567890abcdef0001");
        when(userRepository.findById("68dc1234567890abcdef0001")).thenReturn(Optional.of(user));

        UserResponse response = userService.getUser("68dc1234567890abcdef0001");

        assertEquals("68dc1234567890abcdef0001", response.id());
        assertEquals("Josvier Rodriguez", response.name());
        assertEquals("josvier@example.com", response.email());
        assertEquals(LocalDateTime.of(2026, 9, 29, 10, 0), response.createdAt());
    }

    @Test
    void getUser_notFound_fails() {
        when(userRepository.findById("68dc1234567890abcdef0005")).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> userService.getUser("68dc1234567890abcdef0005"));

        assertEquals("User with id 68dc1234567890abcdef0005 was not found", exception.getMessage());
    }
}
