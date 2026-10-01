package com.josvier.simplebank.dashboard.dto;

import com.josvier.simplebank.auth.model.AuthRole;

import java.time.LocalDateTime;

public interface RoleDashboardResponse {
    AuthRole role();
    LocalDateTime generatedAt();
}
