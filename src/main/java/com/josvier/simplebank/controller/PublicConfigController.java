package com.josvier.simplebank.controller;

import com.josvier.simplebank.config.RuntimeEnvironment;
import com.josvier.simplebank.dto.response.HealthResponse;
import com.josvier.simplebank.dto.response.PublicConfigResponse;
import com.josvier.simplebank.dto.response.ReadinessResponse;
import com.josvier.simplebank.service.ReadinessService;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/public")
public class PublicConfigController {

    private final Environment environment;
    private final ReadinessService readiness;

    public PublicConfigController(Environment environment, ReadinessService readiness) {
        this.environment = environment;
        this.readiness = readiness;
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

    @GetMapping("/ready")
    public ResponseEntity<ReadinessResponse> ready() {
        ReadinessResponse body = readiness.check();
        HttpStatus status = "UP".equals(body.status()) ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
        return ResponseEntity.status(status).body(body);
    }
}
