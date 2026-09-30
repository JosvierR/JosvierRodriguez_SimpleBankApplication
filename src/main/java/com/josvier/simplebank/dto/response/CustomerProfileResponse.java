package com.josvier.simplebank.dto.response;

import java.time.LocalDateTime;

public record CustomerProfileResponse(String name, String email, LocalDateTime createdAt) {
}
