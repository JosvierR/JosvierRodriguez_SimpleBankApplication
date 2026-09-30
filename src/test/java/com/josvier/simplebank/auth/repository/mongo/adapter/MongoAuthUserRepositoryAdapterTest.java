package com.josvier.simplebank.auth.repository.mongo.adapter;

import com.josvier.simplebank.auth.model.AuthRole;
import com.josvier.simplebank.auth.model.AuthUser;
import com.josvier.simplebank.auth.repository.mongo.document.AuthUserDocument;
import com.josvier.simplebank.auth.repository.mongo.springdata.SpringDataAuthUserMongoRepository;
import com.josvier.simplebank.exception.DuplicateResourceException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DuplicateKeyException;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MongoAuthUserRepositoryAdapterTest {

    private static final String AUTH_ID = "68dc1234567890abcdef0101";

    @Mock
    private SpringDataAuthUserMongoRepository authUsers;

    @InjectMocks
    private MongoAuthUserRepositoryAdapter adapter;

    @Test
    void save_mapsDomainToDocumentAndReturnsGeneratedId() {
        LocalDateTime createdAt = LocalDateTime.of(2026, 9, 30, 15, 0);
        when(authUsers.save(any(AuthUserDocument.class))).thenAnswer(invocation -> {
            AuthUserDocument document = invocation.getArgument(0);
            document.setId(AUTH_ID);
            return document;
        });

        AuthUser saved = adapter.save(user(createdAt));

        ArgumentCaptor<AuthUserDocument> captor = ArgumentCaptor.forClass(AuthUserDocument.class);
        verify(authUsers).save(captor.capture());
        AuthUserDocument sent = captor.getValue();
        assertEquals("ada", sent.getUsername());
        assertEquals("ada@example.com", sent.getEmail());
        assertEquals("stored-hash", sent.getPasswordHash());
        assertEquals(Set.of(AuthRole.USER), sent.getRoles());
        assertTrue(sent.isEnabled());
        assertEquals(createdAt, sent.getCreatedAt());
        assertEquals(AUTH_ID, saved.getId());
    }

    @Test
    void save_duplicateKey_becomesDuplicateResource() {
        when(authUsers.save(any(AuthUserDocument.class))).thenThrow(new DuplicateKeyException("unique"));

        DuplicateResourceException exception = assertThrows(
                DuplicateResourceException.class,
                () -> adapter.save(user(LocalDateTime.now())));

        assertEquals("Username or email is already registered", exception.getMessage());
        assertFalse(exception.getMessage().contains("stored-hash"));
    }

    @Test
    void findByUsername_mapsDocumentToDomain() {
        when(authUsers.findByUsername("ada")).thenReturn(Optional.of(document()));

        AuthUser user = adapter.findByUsername("ada").orElseThrow();

        assertEquals(AUTH_ID, user.getId());
        assertEquals("ada", user.getUsername());
        assertEquals(Set.of(AuthRole.USER), user.getRoles());
        assertFalse(user.toString().contains("stored-hash"));
    }

    @Test
    void existsByUsername_falseWhenMissing() {
        when(authUsers.existsByUsername("missing")).thenReturn(false);

        assertFalse(adapter.existsByUsername("missing"));
        assertFalse(adapter.existsByUsername(null));
        assertFalse(adapter.findByUsername(null).isPresent());
    }

    private static AuthUser user(LocalDateTime createdAt) {
        return new AuthUser("ada", "ada@example.com", "stored-hash", Set.of(AuthRole.USER), true, createdAt);
    }

    private static AuthUserDocument document() {
        AuthUserDocument document = new AuthUserDocument();
        document.setId(AUTH_ID);
        document.setUsername("ada");
        document.setEmail("ada@example.com");
        document.setPasswordHash("stored-hash");
        document.setRoles(Set.of(AuthRole.USER));
        document.setEnabled(true);
        document.setCreatedAt(LocalDateTime.of(2026, 9, 30, 15, 0));
        return document;
    }
}
