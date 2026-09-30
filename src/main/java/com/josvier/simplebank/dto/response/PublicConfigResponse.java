package com.josvier.simplebank.dto.response;

import java.util.List;

public record PublicConfigResponse(
        boolean demoMode,
        boolean registrationEnabled,
        List<String> supportedLanguages
) {
}
