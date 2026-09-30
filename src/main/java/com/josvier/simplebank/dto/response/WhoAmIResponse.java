package com.josvier.simplebank.dto.response;

import java.util.List;

/**
 * Who the bearer token is. This is the API login, not a bank customer.
 */
public record WhoAmIResponse(String username, List<String> roles) {
}
