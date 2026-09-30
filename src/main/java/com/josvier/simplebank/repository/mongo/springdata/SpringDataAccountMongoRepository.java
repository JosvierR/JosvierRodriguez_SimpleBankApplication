package com.josvier.simplebank.repository.mongo.springdata;

import com.josvier.simplebank.repository.mongo.document.AccountDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.math.BigDecimal;
import java.util.List;

/**
 * Spring Data infrastructure for the {@code accounts} collection.
 *
 * {@code findByUserId} uses the {@code user_id_idx} index instead of loading
 * every account into the application and filtering there.
 */
public interface SpringDataAccountMongoRepository extends MongoRepository<AccountDocument, String> {

    List<AccountDocument> findByUserId(String userId);

    List<AccountDocument> findByBalanceGreaterThanEqual(BigDecimal balance);
}
