package com.josvier.simplebank.dashboard.dto;

import com.josvier.simplebank.auth.model.AuthRole;

public record DashboardRoleCount(AuthRole role, long count) {
}
