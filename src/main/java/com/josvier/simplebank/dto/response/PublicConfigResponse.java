package com.josvier.simplebank.dto.response;

import java.util.List;

public record PublicConfigResponse(
        boolean demoMode,
        String environment,
        boolean registrationEnabled,
        List<String> supportedLanguages
) {
}
