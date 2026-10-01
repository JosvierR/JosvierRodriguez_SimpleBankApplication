package com.josvier.simplebank.service;

import com.josvier.simplebank.dto.response.ReadinessResponse;

/**
 * Answers whether this process can reach MongoDB.
 *
 * Liveness stays on {@code GET /api/public/health}. This check is the one
 * a host should use before sending traffic.
 */
public interface ReadinessService {

    ReadinessResponse check();
}
