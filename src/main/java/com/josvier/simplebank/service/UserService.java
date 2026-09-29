package com.josvier.simplebank.service;

import com.josvier.simplebank.dto.request.CreateUserRequest;
import com.josvier.simplebank.dto.request.UpdateUserRequest;
import com.josvier.simplebank.dto.response.UserResponse;

import java.util.List;

/**
 * Customer operations the rest of the application is allowed to call.
 * The controller depends on this interface, not on {@code UserServiceImpl}.
 */
public interface UserService {

    /**
     * Creates a user when the email is not already registered.
     *
     * @throws com.josvier.simplebank.exception.DuplicateResourceException if the email exists
     */
    UserResponse createUser(CreateUserRequest request);

    /**
     * Returns every customer currently stored.
     */
    List<UserResponse> getUsers();

    /**
     * Returns one user.
     *
     * @throws com.josvier.simplebank.exception.ResourceNotFoundException if the id does not exist
     */
    UserResponse getUser(String userId);

    /**
     * Replaces the name and email of an existing user. The id and creation time stay the same.
     *
     * @throws com.josvier.simplebank.exception.ResourceNotFoundException if the id does not exist
     * @throws com.josvier.simplebank.exception.DuplicateResourceException if another user already has the email
     */
    UserResponse updateUser(String userId, UpdateUserRequest request);

    /**
     * Deletes a user who does not own any accounts.
     *
     * @throws com.josvier.simplebank.exception.ResourceNotFoundException if the id does not exist
     * @throws com.josvier.simplebank.exception.ResourceConflictException if the user still owns accounts
     */
    void deleteUser(String userId);
}
