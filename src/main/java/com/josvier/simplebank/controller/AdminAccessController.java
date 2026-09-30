package com.josvier.simplebank.controller;

import com.josvier.simplebank.auth.dto.request.UpdateAuthEnabledRequest;
import com.josvier.simplebank.auth.dto.request.UpdateAuthRoleRequest;
import com.josvier.simplebank.auth.dto.request.UpdateCustomerLinkRequest;
import com.josvier.simplebank.auth.dto.response.AdminAuthUserResponse;
import com.josvier.simplebank.auth.dto.response.SecurityAuditResponse;
import com.josvier.simplebank.auth.service.AdminAuthUserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAccessController {
    private final AdminAuthUserService service;

    public AdminAccessController(AdminAuthUserService service) {
        this.service = service;
    }

    @GetMapping("/auth-users")
    public ResponseEntity<List<AdminAuthUserResponse>> users() {
        return ResponseEntity.ok(service.getUsers());
    }

    @GetMapping("/auth-users/{id}")
    public ResponseEntity<AdminAuthUserResponse> user(@PathVariable String id) {
        return ResponseEntity.ok(service.getUser(id));
    }

    @PutMapping("/auth-users/{id}/role")
    public ResponseEntity<AdminAuthUserResponse> role(@PathVariable String id,
                                                       @Valid @RequestBody UpdateAuthRoleRequest request) {
        return ResponseEntity.ok(service.changeRole(id, request.role()));
    }

    @PutMapping("/auth-users/{id}/enabled")
    public ResponseEntity<AdminAuthUserResponse> enabled(@PathVariable String id,
            @Valid @RequestBody UpdateAuthEnabledRequest request) {
        return ResponseEntity.ok(service.changeEnabled(id, request.enabled()));
    }

    @PutMapping("/auth-users/{id}/customer-link")
    public ResponseEntity<AdminAuthUserResponse> link(@PathVariable String id,
            @Valid @RequestBody UpdateCustomerLinkRequest request) {
        return ResponseEntity.ok(service.linkCustomer(id, request.bankUserId()));
    }

    @DeleteMapping("/auth-users/{id}/customer-link")
    public ResponseEntity<AdminAuthUserResponse> unlink(@PathVariable String id) {
        return ResponseEntity.ok(service.unlinkCustomer(id));
    }

    @GetMapping("/security-audits")
    public ResponseEntity<List<SecurityAuditResponse>> audits() {
        return ResponseEntity.ok(service.getSecurityAudits());
    }
}
