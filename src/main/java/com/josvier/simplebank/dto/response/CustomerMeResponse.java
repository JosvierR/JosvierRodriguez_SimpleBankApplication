package com.josvier.simplebank.dto.response;

public record CustomerMeResponse(
        String username,
        String role,
        boolean bankUserLinked,
        CustomerProfileResponse profile
) {
}
