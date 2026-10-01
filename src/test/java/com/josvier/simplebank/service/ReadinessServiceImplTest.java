package com.josvier.simplebank.service;

import com.josvier.simplebank.dto.response.ReadinessResponse;
import com.josvier.simplebank.service.impl.ReadinessServiceImpl;
import com.mongodb.MongoTimeoutException;
import org.bson.Document;
import org.junit.jupiter.api.Test;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.data.mongodb.core.MongoTemplate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ReadinessServiceImplTest {

    @Test
    void pingSuccess_reportsUpWithSafeRevision() {
        MongoTemplate mongo = mock(MongoTemplate.class);
        when(mongo.executeCommand(any(Document.class))).thenReturn(new Document("ok", 1.0d));
        StandardEnvironment environment = new StandardEnvironment();
        environment.setActiveProfiles("staging");

        ReadinessResponse response = new ReadinessServiceImpl(mongo, environment, "abc123").check();

        assertEquals("UP", response.status());
        assertEquals("staging", response.environment());
        assertEquals("abc123", response.revision());
        assertSafe(response);
    }

    @Test
    void pingFailure_reportsDownWithoutDriverDetails() {
        MongoTemplate mongo = mock(MongoTemplate.class);
        when(mongo.executeCommand(any(Document.class)))
                .thenThrow(new MongoTimeoutException("timed out while selecting a server"));
        StandardEnvironment environment = new StandardEnvironment();

        ReadinessResponse response = new ReadinessServiceImpl(mongo, environment, "local").check();

        assertEquals("DOWN", response.status());
        assertEquals("local", response.environment());
        assertEquals("local", response.revision());
        assertSafe(response);
    }

    @Test
    void rejectedPing_reportsDown() {
        MongoTemplate mongo = mock(MongoTemplate.class);
        when(mongo.executeCommand(any(Document.class))).thenReturn(new Document("ok", 0));

        ReadinessResponse response = new ReadinessServiceImpl(mongo, new StandardEnvironment(), "local").check();

        assertEquals("DOWN", response.status());
    }

    private static void assertSafe(ReadinessResponse response) {
        String body = response.status() + response.environment() + response.revision();
        assertFalse(body.contains("mongodb"));
        assertFalse(body.contains("secret"));
        assertFalse(body.contains("@"));
        assertFalse(body.contains("simple_bank"));
    }
}
