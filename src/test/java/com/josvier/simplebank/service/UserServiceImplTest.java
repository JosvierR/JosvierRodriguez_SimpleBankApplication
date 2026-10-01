package com.josvier.simplebank.service;

import com.josvier.simplebank.dto.request.CreateUserRequest;
import com.josvier.simplebank.dto.request.UpdateUserRequest;
import com.josvier.simplebank.dto.response.UserResponse;
import com.josvier.simplebank.auth.model.AuthRole;
import com.josvier.simplebank.exception.DuplicateResourceException;
import com.josvier.simplebank.exception.InvalidTransactionException;
import com.josvier.simplebank.exception.ResourceConflictException;
import com.josvier.simplebank.exception.ResourceNotFoundException;
import com.josvier.simplebank.model.Account;
import com.josvier.simplebank.model.AccountType;
import com.josvier.simplebank.model.User;
import com.josvier.simplebank.repository.AccountRepository;
import com.josvier.simplebank.repository.UserRepository;
import com.josvier.simplebank.security.actor.CurrentActor;
import com.josvier.simplebank.security.authorization.BankAuthorizationService;
import com.josvier.simplebank.service.impl.UserServiceImpl;
import org.springframework.security.access.AccessDeniedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
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

    private static final String USER_ID = "68dc1234567890abcdef0001";
    private static final String OTHER_USER_ID = "68dc1234567890abcdef0002";

    @Mock
    private UserRepository userRepository;

    @Mock
    private AccountRepository accountRepository;

    private UserService userService;

    @BeforeEach
    void setUp() {
        userService = new UserServiceImpl(userRepository, accountRepository);
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

    @Test
    void getUsers_returnsAllUsers() {
        when(userRepository.findAll()).thenReturn(List.of(
                storedUser(USER_ID, "Customer One", "customer1@example.com"),
                storedUser(OTHER_USER_ID, "Customer Two", "customer2@example.com")));

        List<UserResponse> users = userService.getUsers();

        assertEquals(2, users.size());
        assertEquals(USER_ID, users.get(0).id());
        assertEquals("Customer Two", users.get(1).name());
    }

    @Test
    void updateUser_success() {
        User user = storedUser(USER_ID, "Customer One", "customer1@example.com");
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(userRepository.findByEmail("updated@example.com")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserResponse response = userService.updateUser(USER_ID, new UpdateUserRequest(" Updated Name ", " updated@example.com "));

        assertEquals(USER_ID, response.id());
        assertEquals("Updated Name", response.name());
        assertEquals("updated@example.com", response.email());
        assertEquals(user.getCreatedAt(), response.createdAt());
    }

    @Test
    void updateUser_notFound() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> userService.updateUser(USER_ID, new UpdateUserRequest("Name", "name@example.com")));
        verify(userRepository, never()).save(any());
    }

    @Test
    void updateUser_duplicateEmail() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(storedUser(USER_ID, "Customer One", "customer1@example.com")));
        when(userRepository.findByEmail("customer2@example.com"))
                .thenReturn(Optional.of(storedUser(OTHER_USER_ID, "Customer Two", "customer2@example.com")));

        DuplicateResourceException exception = assertThrows(DuplicateResourceException.class,
                () -> userService.updateUser(USER_ID, new UpdateUserRequest("Customer One", "customer2@example.com")));

        assertEquals("User with email customer2@example.com already exists", exception.getMessage());
        verify(userRepository, never()).save(any());
    }

    @Test
    void updateUser_preservesId() {
        User user = storedUser(USER_ID, "Customer One", "customer1@example.com");
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(userRepository.findByEmail("updated@example.com")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        userService.updateUser(USER_ID, new UpdateUserRequest("Updated Name", "updated@example.com"));

        assertEquals(USER_ID, user.getId());
    }

    @Test
    void updateUser_preservesCreatedAt() {
        LocalDateTime createdAt = LocalDateTime.of(2026, 9, 29, 10, 0);
        User user = storedUser(USER_ID, "Customer One", "customer1@example.com");
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(userRepository.findByEmail("updated@example.com")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserResponse response = userService.updateUser(USER_ID, new UpdateUserRequest("Updated Name", "updated@example.com"));

        assertEquals(createdAt, response.createdAt());
        assertEquals(createdAt, user.getCreatedAt());
    }

    @Test
    void searchByFirstName_usesRepositoryPrefixAndCanBeEmpty() {
        when(userRepository.findByNameStartingWithIgnoreCase("josvier")).thenReturn(List.of(
                storedUser("1", "Josvier Rodriguez", "a@example.com"),
                storedUser("2", "Josvier Perez", "b@example.com")));
        when(userRepository.findByNameStartingWithIgnoreCase("john")).thenReturn(List.of(
                storedUser("3", "John Smith", "c@example.com")));
        when(userRepository.findByNameStartingWithIgnoreCase("nobody")).thenReturn(List.of());

        assertEquals(2, userService.searchByFirstName(" josvier ").size());
        assertEquals(1, userService.searchByFirstName("john").size());
        assertEquals(0, userService.searchByFirstName("nobody").size());
        verify(userRepository).findByNameStartingWithIgnoreCase("josvier");
    }

    @Test
    void searchByFirstName_rejectsBlankAndCustomers() {
        assertThrows(InvalidTransactionException.class, () -> userService.searchByFirstName("  "));
        UserService customerService = new UserServiceImpl(userRepository, accountRepository,
                new BankAuthorizationService(() -> new CurrentActor("auth", "sofia", AuthRole.CUSTOMER, USER_ID)));
        assertThrows(AccessDeniedException.class, () -> customerService.searchByFirstName("Josvier"));
        verify(userRepository, never()).findByNameStartingWithIgnoreCase(any());
    }

    @Test
    void deleteUser_success() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(storedUser(USER_ID, "Customer Three", "customer3@example.com")));
        when(accountRepository.findByUserId(USER_ID)).thenReturn(List.of());

        userService.deleteUser(USER_ID);

        verify(userRepository).deleteById(USER_ID);
    }

    @Test
    void deleteUser_notFound() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> userService.deleteUser(USER_ID));
        verify(userRepository, never()).deleteById(any());
    }

    @Test
    void deleteUser_withExistingAccount_returnsConflict() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(storedUser(USER_ID, "Customer Two", "customer2@example.com")));
        Account account = new Account(USER_ID, new BigDecimal("0.00"), AccountType.SAVINGS, LocalDateTime.now());
        when(accountRepository.findByUserId(USER_ID)).thenReturn(List.of(account));

        ResourceConflictException exception = assertThrows(ResourceConflictException.class, () -> userService.deleteUser(USER_ID));

        assertEquals("User cannot be deleted while accounts still exist", exception.getMessage());
        verify(userRepository, never()).deleteById(any());
    }

    private User storedUser(String id, String name, String email) {
        User user = new User(name, email, LocalDateTime.of(2026, 9, 29, 10, 0));
        user.setId(id);
        return user;
    }
}
