package com.josvier.simplebank.service.impl;

import com.josvier.simplebank.dto.request.CreateUserRequest;
import com.josvier.simplebank.dto.response.UserResponse;
import com.josvier.simplebank.exception.DuplicateResourceException;
import com.josvier.simplebank.exception.ResourceNotFoundException;
import com.josvier.simplebank.model.User;
import com.josvier.simplebank.repository.UserRepository;
import com.josvier.simplebank.service.UserService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * User business rules.
 *
 * The email check here produces a friendly 409 before a save is attempted.
 * The Mongo unique index is the race-safe guarantee: if two requests pass
 * this check together, the adapter turns the database duplicate into the
 * same {@link DuplicateResourceException}.
 */
@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    public UserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserResponse createUser(CreateUserRequest request) {
        String name = request.name().trim();
        String email = request.email().trim();

        if (userRepository.findByEmail(email).isPresent()) {
            throw new DuplicateResourceException("User with email " + email + " already exists");
        }

        User saved = userRepository.save(new User(name, email, LocalDateTime.now()));
        return toResponse(saved);
    }

    @Override
    public UserResponse getUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User with id " + userId + " was not found"));
        return toResponse(user);
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getCreatedAt());
    }
}
