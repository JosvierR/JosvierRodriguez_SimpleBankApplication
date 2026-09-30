package com.josvier.simplebank.controller;

import com.josvier.simplebank.dto.response.AuditResponse;
import com.josvier.simplebank.dto.response.ErrorResponse;
import com.josvier.simplebank.service.AuditService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * HTTP adapter for compliance traces.
 *
 * Deposit, withdrawal, and transfer rules are not implemented here.
 * This class only asks {@link AuditService} for records that were already written.
 */
@Tag(name = "Audits", description = "Trace who moved money, when, which accounts, and how much")
@RestController
@RequestMapping("/api/audits")
public class AuditController {

    private final AuditService auditService;

    public AuditController(AuditService auditService) {
        this.auditService = auditService;
    }

    @Operation(summary = "List audit traces, oldest first")
    @ApiResponse(responseCode = "200", description = "Every stored trace. The list can be empty")
    @GetMapping
    public ResponseEntity<List<AuditResponse>> getAudits() {
        return ResponseEntity.ok(auditService.getAudits());
    }

    @Operation(summary = "View one audit trace")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Trace found: who, when, accounts involved, and amount"),
            @ApiResponse(responseCode = "404", description = "Audit does not exist",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<AuditResponse> getAudit(@PathVariable String id) {
        return ResponseEntity.ok(auditService.getAudit(id));
    }
}
