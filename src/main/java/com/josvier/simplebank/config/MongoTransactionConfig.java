package com.josvier.simplebank.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.MongoTransactionManager;

/**
 * Makes a deposit or withdrawal one MongoDB transaction.
 *
 * Saving the account and saving the history row are two documents. Without
 * this manager those writes can succeed independently. Atlas is a replica
 * set, which is what MongoDB requires before a multi-document transaction
 * is allowed to commit.
 */
@Configuration
public class MongoTransactionConfig {

    @Bean
    public MongoTransactionManager transactionManager(MongoDatabaseFactory databaseFactory) {
        return new MongoTransactionManager(databaseFactory);
    }
}
