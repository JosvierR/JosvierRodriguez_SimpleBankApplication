package com.josvier.simplebank.auth.service;

import com.josvier.simplebank.auth.dto.request.LoginRequest;
import com.josvier.simplebank.auth.dto.request.RegisterRequest;
import com.josvier.simplebank.auth.dto.response.AuthResponse;

/**
 * Register and login. Banking services do not depend on this type.
 */
public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);
}
