package com.josvier.simplebank.repository.memory;

import com.josvier.simplebank.model.User;
import com.josvier.simplebank.repository.UserRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * User storage that lives only inside this running application.
 *
 * {@link ConcurrentHashMap} allows concurrent reads and writes without a
 * single global lock. {@link AtomicLong} issues ids without two requests
 * receiving the same number. Nothing is written to disk, so all users
 * disappear when the process stops.
 */
@Repository
public class InMemoryUserRepository implements UserRepository {

    private final ConcurrentHashMap<Long, User> users = new ConcurrentHashMap<>();
    private final AtomicLong idSequence = new AtomicLong(0);

    @Override
    public User save(User user) {
        if (user.getId() == null) {
            user.setId(idSequence.incrementAndGet());
        }
        users.put(user.getId(), user.copy());
        return user;
    }

    @Override
    public Optional<User> findById(Long id) {
        if (id == null) {
            return Optional.empty();
        }
        return Optional.ofNullable(users.get(id)).map(User::copy);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        if (email == null) {
            return Optional.empty();
        }
        return users.values().stream()
                .filter(user -> email.equals(user.getEmail()))
                .findFirst()
                .map(User::copy);
    }

    @Override
    public List<User> findAll() {
        return users.values().stream()
                .map(User::copy)
                .toList();
    }
}
