package com.josvier.simplebank.auth.dto.request;

import jakarta.validation.constraints.NotBlank;

public record UpdateCustomerLinkRequest(@NotBlank String bankUserId) {
}
