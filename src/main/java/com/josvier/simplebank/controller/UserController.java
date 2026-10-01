package com.josvier.simplebank.controller;

import com.josvier.simplebank.dto.request.CreateUserRequest;
import com.josvier.simplebank.dto.request.UpdateUserRequest;
import com.josvier.simplebank.dto.response.AccountResponse;
import com.josvier.simplebank.dto.response.ErrorResponse;
import com.josvier.simplebank.dto.response.UserResponse;
import com.josvier.simplebank.service.AccountService;
import com.josvier.simplebank.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * HTTP adapter for customer operations.
 *
 * This class reads the request, asks {@link UserService} to do the work,
 * and chooses the HTTP status. It does not check email uniqueness or create ids.
 */
@Tag(name = "Users", description = "Create, view, update, and delete customers")
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final AccountService accountService;

    public UserController(UserService userService, AccountService accountService) {
        this.userService = userService;
        this.accountService = accountService;
    }

    @Operation(summary = "Create a user")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "User created"),
            @ApiResponse(responseCode = "400", description = "Invalid name or email",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "Email already registered",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping
    @PreAuthorize("hasAnyRole('TELLER','MANAGER','ADMIN')")
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        UserResponse response = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "Search customers by the start of their name")
    @ApiResponse(responseCode = "200", description = "Matching customers. The list can be empty")
    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('TELLER','MANAGER','AUDITOR','ADMIN')")
    public ResponseEntity<List<UserResponse>> searchByFirstName(@RequestParam String firstName) {
        return ResponseEntity.ok(userService.searchByFirstName(firstName));
    }

    @Operation(summary = "List all users")
    @ApiResponse(responseCode = "200", description = "Every stored customer. The list can be empty")
    @GetMapping
    @PreAuthorize("hasAnyRole('TELLER','MANAGER','AUDITOR','ADMIN')")
    public ResponseEntity<List<UserResponse>> getUsers() {
        return ResponseEntity.ok(userService.getUsers());
    }

    @Operation(summary = "View a user")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "User found"),
            @ApiResponse(responseCode = "404", description = "User does not exist",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('CUSTOMER','TELLER','MANAGER','AUDITOR','ADMIN')")
    public ResponseEntity<UserResponse> getUser(@PathVariable String id) {
        return ResponseEntity.ok(userService.getUser(id));
    }

    @Operation(summary = "Update a user's name and email")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "User updated. The id and createdAt stay the same"),
            @ApiResponse(responseCode = "400", description = "Invalid name or email",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "User does not exist",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "Email already belongs to another user",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    public ResponseEntity<UserResponse> updateUser(@PathVariable String id, @Valid @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(userService.updateUser(id, request));
    }

    @Operation(summary = "Delete a user who owns no accounts")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "User deleted"),
            @ApiResponse(responseCode = "404", description = "User does not exist",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "User still owns one or more accounts",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable String id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "List accounts owned by one user")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Accounts for that user. An existing user with none returns an empty list"),
            @ApiResponse(responseCode = "404", description = "User does not exist",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}/accounts")
    @PreAuthorize("hasAnyRole('CUSTOMER','TELLER','MANAGER','AUDITOR','ADMIN')")
    public ResponseEntity<List<AccountResponse>> getAccountsByUser(@PathVariable String id) {
        return ResponseEntity.ok(accountService.getAccountsByUser(id));
    }
}
