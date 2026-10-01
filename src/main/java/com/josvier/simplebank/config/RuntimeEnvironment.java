package com.josvier.simplebank.config;

import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;

/**
 * Public name of the running profile. Never includes a host, database, or secret.
 */
public final class RuntimeEnvironment {

    private RuntimeEnvironment() {
    }

    public static String name(Environment environment) {
        if (environment.acceptsProfiles(Profiles.of("production"))) {
            return "production";
        }
        if (environment.acceptsProfiles(Profiles.of("staging"))) {
            return "staging";
        }
        if (environment.acceptsProfiles(Profiles.of("demo"))) {
            return "demo";
        }
        return "local";
    }
}
