package com.josvier.simplebank.controller;

import com.josvier.simplebank.config.RuntimeEnvironment;
import com.josvier.simplebank.dto.response.HealthResponse;
import com.josvier.simplebank.dto.response.PublicConfigResponse;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/public")
public class PublicConfigController {

    private final Environment environment;

    public PublicConfigController(Environment environment) {
        this.environment = environment;
    }

    @GetMapping("/config")
    public PublicConfigResponse config() {
        boolean demoMode = environment.acceptsProfiles(Profiles.of("demo"));
        return new PublicConfigResponse(demoMode, RuntimeEnvironment.name(environment), true, List.of("en", "es", "fr"));
    }

    @GetMapping("/health")
    public HealthResponse health() {
        return new HealthResponse("UP", RuntimeEnvironment.name(environment));
    }
}
