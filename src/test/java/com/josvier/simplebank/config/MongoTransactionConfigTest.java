package com.josvier.simplebank.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.MongoTransactionManager;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.mock;

/**
 * Proves the configuration class registers a transaction manager.
 *
 * The factory is a mock, so this does not open a MongoDB transaction and
 * does not prove that a failed history insert rolls back the balance.
 */
@SpringJUnitConfig(MongoTransactionConfigTest.TestConfig.class)
class MongoTransactionConfigTest {

    @Autowired
    private MongoTransactionManager transactionManager;

    @Test
    void exposesMongoTransactionManager() {
        assertNotNull(transactionManager);
    }

    @Configuration
    @Import(MongoTransactionConfig.class)
    static class TestConfig {

        @Bean
        MongoDatabaseFactory mongoDatabaseFactory() {
            return mock(MongoDatabaseFactory.class);
        }
    }
}
