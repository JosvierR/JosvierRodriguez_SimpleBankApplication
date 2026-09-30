package com.josvier.simplebank.controller;

import com.josvier.simplebank.dto.response.ErrorResponse;
import com.josvier.simplebank.dto.response.WhoAmIResponse;
import com.josvier.simplebank.security.service.CustomUserDetailsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * One admin-only route used to show role checks.
 *
 * There is no public way to become ADMIN and no built-in admin password.
 */
@Tag(name = "Admin", description = "Requires role ADMIN. Normal banking does not use this route.")
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Operation(summary = "Show the authenticated admin login",
            description = "ADMIN role required. Returns the API username and roles, not bank data.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Caller has ADMIN"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid bearer token",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Authenticated, but not ADMIN",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/whoami")
    public ResponseEntity<WhoAmIResponse> whoami(@AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(new WhoAmIResponse(
                principal.getUsername(),
                CustomUserDetailsService.roleNames(principal)
        ));
    }
}
