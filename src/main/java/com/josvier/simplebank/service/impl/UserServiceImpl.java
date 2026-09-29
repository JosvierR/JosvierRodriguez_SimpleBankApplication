package com.josvier.simplebank.service.impl;

import com.josvier.simplebank.dto.request.CreateUserRequest;
import com.josvier.simplebank.dto.request.UpdateUserRequest;
import com.josvier.simplebank.dto.response.UserResponse;
import com.josvier.simplebank.exception.DuplicateResourceException;
import com.josvier.simplebank.exception.ResourceConflictException;
import com.josvier.simplebank.exception.ResourceNotFoundException;
import com.josvier.simplebank.model.User;
import com.josvier.simplebank.repository.AccountRepository;
import com.josvier.simplebank.repository.UserRepository;
import com.josvier.simplebank.service.UserService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * User business rules.
 *
 * The email check here produces a friendly 409 before a save is attempted.
 * The Mongo unique index is the race-safe guarantee: if two requests pass
 * this check together, the adapter turns the database duplicate into the
 * same {@link DuplicateResourceException}.
 *
 * A customer who still owns accounts is not deleted. That would leave
 * account documents pointing at a user id that no longer exists.
 */
@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;

    public UserServiceImpl(UserRepository userRepository, AccountRepository accountRepository) {
        this.userRepository = userRepository;
        this.accountRepository = accountRepository;
    }

    @Override
    public UserResponse createUser(CreateUserRequest request) {
        String name = request.name().trim();
        String email = request.email().trim();
        rejectDuplicateEmail(email, null);

        User saved = userRepository.save(new User(name, email, LocalDateTime.now()));
        return toResponse(saved);
    }

    @Override
    public List<UserResponse> getUsers() {
        return userRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public UserResponse getUser(String userId) {
        return toResponse(findUser(userId));
    }

    @Override
    public UserResponse updateUser(String userId, UpdateUserRequest request) {
        User user = findUser(userId);
        String name = request.name().trim();
        String email = request.email().trim();
        rejectDuplicateEmail(email, user.getId());
        user.updateProfile(name, email);
        return toResponse(userRepository.save(user));
    }

    @Override
    public void deleteUser(String userId) {
        findUser(userId);
        if (!accountRepository.findByUserId(userId).isEmpty()) {
            throw new ResourceConflictException("User cannot be deleted while accounts still exist");
        }
        userRepository.deleteById(userId);
    }

    private User findUser(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User with id " + userId + " was not found"));
    }

    /**
     * {@code ownerId} is the user being updated. A match on that same id is the
     * customer keeping their own email, which is not a conflict.
     */
    private void rejectDuplicateEmail(String email, String ownerId) {
        userRepository.findByEmail(email).ifPresent(existing -> {
            if (ownerId == null || !ownerId.equals(existing.getId())) {
                throw new DuplicateResourceException("User with email " + email + " already exists");
            }
        });
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getCreatedAt());
    }
}
