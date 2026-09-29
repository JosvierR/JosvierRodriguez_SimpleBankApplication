package com.josvier.simplebank.service;

import com.josvier.simplebank.dto.request.CreateUserRequest;
import com.josvier.simplebank.dto.response.UserResponse;

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
     * Returns one user.
     *
     * @throws com.josvier.simplebank.exception.ResourceNotFoundException if the id does not exist
     */
    UserResponse getUser(Long userId);
}
