package com.josvier.simplebank.controller;

import com.josvier.simplebank.dto.request.AmountRequest;
import com.josvier.simplebank.dto.request.CreateAccountRequest;
import com.josvier.simplebank.dto.request.TransferRequest;
import com.josvier.simplebank.dto.request.UpdateAccountRequest;
import com.josvier.simplebank.dto.response.AccountResponse;
import com.josvier.simplebank.dto.response.ErrorResponse;
import com.josvier.simplebank.dto.response.TransactionResponse;
import com.josvier.simplebank.dto.response.TransferResponse;
import com.josvier.simplebank.service.AccountService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;

/**
 * HTTP adapter for account operations.
 *
 * Deposit and withdrawal rules are not implemented here. This class only
 * forwards a validated amount to {@link AccountService}.
 */
@Tag(name = "Accounts", description = "Open, update, delete, and move money between accounts")
@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @Operation(summary = "Open an account with balance 0.00")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Account opened"),
            @ApiResponse(responseCode = "400", description = "Missing user id or account type",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "User does not exist",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping
    @PreAuthorize("hasAnyRole('TELLER','MANAGER','ADMIN')")
    public ResponseEntity<AccountResponse> createAccount(@Valid @RequestBody CreateAccountRequest request) {
        AccountResponse response = accountService.createAccount(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "List all accounts")
    @ApiResponse(responseCode = "200", description = "Every stored account. The list can be empty")
    @GetMapping
    @PreAuthorize("hasAnyRole('TELLER','MANAGER','AUDITOR','ADMIN')")
    public ResponseEntity<List<AccountResponse>> getAccounts() {
        return ResponseEntity.ok(accountService.getAccounts());
    }

    @Operation(summary = "List premium accounts at or above a balance threshold")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Accounts whose balance is greater than or equal to the threshold. The list can be empty"),
            @ApiResponse(responseCode = "400", description = "Threshold is missing, negative, or has more than 2 decimal places",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/premium")
    @PreAuthorize("hasAnyRole('MANAGER','AUDITOR','ADMIN')")
    public ResponseEntity<List<AccountResponse>> getPremiumAccounts(@RequestParam BigDecimal threshold) {
        return ResponseEntity.ok(accountService.getPremiumAccounts(threshold));
    }

    @Operation(summary = "Transfer money from one account to another")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Transfer accepted. One audit row records both accounts"),
            @ApiResponse(responseCode = "400", description = "Invalid amount, same account, or insufficient funds",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Source or destination account does not exist",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/transfer")
    @PreAuthorize("hasAnyRole('CUSTOMER','MANAGER','ADMIN')")
    public ResponseEntity<TransferResponse> transfer(@Valid @RequestBody TransferRequest request) {
        return ResponseEntity.ok(accountService.transfer(request));
    }

    @Operation(summary = "View an account")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Account found"),
            @ApiResponse(responseCode = "404", description = "Account does not exist",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('CUSTOMER','TELLER','MANAGER','AUDITOR','ADMIN')")
    public ResponseEntity<AccountResponse> getAccount(@PathVariable String id) {
        return ResponseEntity.ok(accountService.getAccount(id));
    }

    @Operation(summary = "Update an account type")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Account type updated. The id, owner, balance, and createdAt stay the same"),
            @ApiResponse(responseCode = "400", description = "Account type is missing",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Account does not exist",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    public ResponseEntity<AccountResponse> updateAccount(@PathVariable String id,
                                                         @Valid @RequestBody UpdateAccountRequest request) {
        return ResponseEntity.ok(accountService.updateAccount(id, request));
    }

    @Operation(summary = "Delete an account that has no transactions")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Account deleted"),
            @ApiResponse(responseCode = "404", description = "Account does not exist",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "Account still has transaction history",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    public ResponseEntity<Void> deleteAccount(@PathVariable String id) {
        accountService.deleteAccount(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Deposit a positive amount")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Deposit accepted"),
            @ApiResponse(responseCode = "400", description = "Amount is missing, below 0.01, or has more than 2 decimal places",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Account does not exist",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{id}/deposit")
    @PreAuthorize("hasAnyRole('TELLER','MANAGER','ADMIN')")
    public ResponseEntity<AccountResponse> deposit(@PathVariable String id, @Valid @RequestBody AmountRequest request) {
        return ResponseEntity.ok(accountService.deposit(id, request.amount()));
    }

    @Operation(summary = "Withdraw a positive amount the balance can cover")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Withdrawal accepted"),
            @ApiResponse(responseCode = "400", description = "Invalid amount or insufficient funds",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Account does not exist",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{id}/withdraw")
    @PreAuthorize("hasAnyRole('TELLER','MANAGER','ADMIN')")
    public ResponseEntity<AccountResponse> withdraw(@PathVariable String id, @Valid @RequestBody AmountRequest request) {
        return ResponseEntity.ok(accountService.withdraw(id, request.amount()));
    }

    @Operation(summary = "View transaction history, oldest first")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "History returned. An account with no movements returns an empty list"),
            @ApiResponse(responseCode = "404", description = "Account does not exist",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}/transactions")
    @PreAuthorize("hasAnyRole('CUSTOMER','TELLER','MANAGER','AUDITOR','ADMIN')")
    public ResponseEntity<List<TransactionResponse>> getTransactions(@PathVariable String id) {
        return ResponseEntity.ok(accountService.getTransactions(id));
    }
}
