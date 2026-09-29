package com.josvier.simplebank.repository.mongo.adapter;

import com.josvier.simplebank.exception.DuplicateResourceException;
import com.josvier.simplebank.model.User;
import com.josvier.simplebank.repository.mongo.document.UserDocument;
import com.josvier.simplebank.repository.mongo.springdata.SpringDataUserMongoRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DuplicateKeyException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MongoUserRepositoryAdapterTest {

    private static final String USER_ID = "68dc1234567890abcdef0001";

    @Mock
    private SpringDataUserMongoRepository users;

    @InjectMocks
    private MongoUserRepositoryAdapter adapter;

    @Test
    void save_mapsDomainToDocumentAndReturnsGeneratedId() {
        LocalDateTime createdAt = LocalDateTime.of(2026, 9, 29, 10, 0);
        when(users.save(any(UserDocument.class))).thenAnswer(invocation -> {
            UserDocument document = invocation.getArgument(0);
            document.setId(USER_ID);
            return document;
        });

        User saved = adapter.save(new User("Josvier Rodriguez", "josvier@example.com", createdAt));

        ArgumentCaptor<UserDocument> captor = ArgumentCaptor.forClass(UserDocument.class);
        verify(users).save(captor.capture());
        UserDocument sent = captor.getValue();
        assertEquals("Josvier Rodriguez", sent.getName());
        assertEquals("josvier@example.com", sent.getEmail());
        assertEquals(createdAt, sent.getCreatedAt());
        assertEquals(USER_ID, saved.getId());
        assertEquals("josvier@example.com", saved.getEmail());
    }

    @Test
    void save_duplicateKey_becomesDuplicateResource() {
        when(users.save(any(UserDocument.class))).thenThrow(new DuplicateKeyException("email unique"));

        DuplicateResourceException exception = assertThrows(
                DuplicateResourceException.class,
                () -> adapter.save(new User("Josvier Rodriguez", "josvier@example.com", LocalDateTime.now())));

        assertEquals("User with email josvier@example.com already exists", exception.getMessage());
    }

    @Test
    void findById_mapsDocumentToDomain() {
        when(users.findById(USER_ID)).thenReturn(Optional.of(document()));

        User user = adapter.findById(USER_ID).orElseThrow();

        assertEquals(USER_ID, user.getId());
        assertEquals("Josvier Rodriguez", user.getName());
        assertEquals("josvier@example.com", user.getEmail());
    }

    @Test
    void findByEmail_delegatesToSpringData() {
        when(users.findByEmail("josvier@example.com")).thenReturn(Optional.of(document()));

        assertTrue(adapter.findByEmail("josvier@example.com").isPresent());
        verify(users).findByEmail("josvier@example.com");
    }

    @Test
    void findAll_delegatesToSpringData() {
        when(users.findAll()).thenReturn(List.of(document()));

        List<User> found = adapter.findAll();

        assertEquals(1, found.size());
        assertEquals(USER_ID, found.get(0).getId());
        verify(users).findAll();
    }

    @Test
    void deleteById_delegatesToSpringData() {
        adapter.deleteById(USER_ID);

        verify(users).deleteById(USER_ID);
    }

    @Test
    void findById_missing_isEmpty() {
        when(users.findById(USER_ID)).thenReturn(Optional.empty());

        assertTrue(adapter.findById(USER_ID).isEmpty());
    }

    private UserDocument document() {
        UserDocument document = new UserDocument();
        document.setId(USER_ID);
        document.setName("Josvier Rodriguez");
        document.setEmail("josvier@example.com");
        document.setCreatedAt(LocalDateTime.of(2026, 9, 29, 10, 0));
        return document;
    }
}
