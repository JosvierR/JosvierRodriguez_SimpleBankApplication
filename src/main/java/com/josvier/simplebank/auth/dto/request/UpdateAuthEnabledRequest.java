package com.josvier.simplebank.auth.dto.request;

import jakarta.validation.constraints.NotNull;

public record UpdateAuthEnabledRequest(@NotNull Boolean enabled) {
}
