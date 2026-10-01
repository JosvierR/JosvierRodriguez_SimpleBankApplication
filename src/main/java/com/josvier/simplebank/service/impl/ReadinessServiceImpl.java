package com.josvier.simplebank.service.impl;

import com.josvier.simplebank.config.RuntimeEnvironment;
import com.josvier.simplebank.dto.response.ReadinessResponse;
import com.josvier.simplebank.service.ReadinessService;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;

/**
 * Pings MongoDB and reports only status, environment, and revision.
 *
 * A failed ping becomes DOWN. The exception text is not returned, because
 * driver errors can contain a host name.
 */
@Service
public class ReadinessServiceImpl implements ReadinessService {

    private final MongoTemplate mongo;
    private final Environment environment;
    private final String revision;

    public ReadinessServiceImpl(MongoTemplate mongo,
                                Environment environment,
                                @Value("${app.revision:local}") String revision) {
        this.mongo = mongo;
        this.environment = environment;
        this.revision = revision == null || revision.isBlank() ? "local" : revision;
    }

    @Override
    public ReadinessResponse check() {
        String name = RuntimeEnvironment.name(environment);
        try {
            Document result = mongo.executeCommand(new Document("ping", 1));
            String status = pingAccepted(result) ? "UP" : "DOWN";
            return new ReadinessResponse(status, name, revision);
        } catch (RuntimeException ex) {
            return new ReadinessResponse("DOWN", name, revision);
        }
    }

    private static boolean pingAccepted(Document result) {
        if (result == null) {
            return false;
        }
        Object ok = result.get("ok");
        return ok instanceof Number number && number.doubleValue() == 1.0d;
    }
}
