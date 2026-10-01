package com.josvier.simplebank.dto.response;

/**
 * Deployment readiness. The revision is a commit id, not a credential.
 * This response never includes a database URI, host, name, or secret.
 */
public record ReadinessResponse(String status, String environment, String revision) {
}
