package com.josvier.simplebank.config;

import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DeploymentPropertyTest {

    @Test
    void hostedPortFallsBackTo8080() throws Exception {
        String properties = Files.readString(Path.of("src/main/resources/application.properties"));
        assertTrue(properties.contains("server.port=${PORT:8080}"));
        assertTrue(properties.contains("app.revision=${APP_REVISION:${RENDER_GIT_COMMIT:local}}"));
        assertFalse(properties.contains("server.port=10000"));
        assertFalse(properties.contains("server.port=8080"));
    }

    @Test
    void stagingAndProductionKeepDemoSeedOff() throws Exception {
        String staging = Files.readString(Path.of("src/main/resources/application-staging.properties"));
        String production = Files.readString(Path.of("src/main/resources/application-production.properties"));
        assertTrue(staging.contains("simple_bank_staging"));
        assertTrue(staging.contains("demo.seed.enabled=false"));
        assertTrue(staging.contains("demo.seed.reset=false"));
        assertTrue(production.contains("simple_bank_prod"));
        assertTrue(production.contains("demo.seed.enabled=false"));
        assertTrue(production.contains("demo.seed.reset=false"));
        assertFalse(staging.contains("simple_bank_demo"));
        assertFalse(production.contains("simple_bank_demo"));
    }
}
