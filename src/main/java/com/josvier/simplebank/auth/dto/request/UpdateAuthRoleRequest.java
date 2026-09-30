package com.josvier.simplebank.auth.dto.request;

import com.josvier.simplebank.auth.model.AuthRole;
import jakarta.validation.constraints.NotNull;

public record UpdateAuthRoleRequest(@NotNull AuthRole role) {
}
