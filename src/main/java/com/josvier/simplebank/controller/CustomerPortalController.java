package com.josvier.simplebank.controller;

import com.josvier.simplebank.auth.model.AuthRole;
import com.josvier.simplebank.dto.request.CustomerTransferRequest;
import com.josvier.simplebank.dto.request.UpdateUserRequest;
import com.josvier.simplebank.dto.response.AccountResponse;
import com.josvier.simplebank.dto.response.CustomerAccountResponse;
import com.josvier.simplebank.dto.response.CustomerMeResponse;
import com.josvier.simplebank.dto.response.CustomerProfileResponse;
import com.josvier.simplebank.dto.response.CustomerTransactionResponse;
import com.josvier.simplebank.dto.response.CustomerTransferReceiptResponse;
import com.josvier.simplebank.dto.response.TransactionResponse;
import com.josvier.simplebank.dto.response.TransferPreviewResponse;
import com.josvier.simplebank.dto.response.UserResponse;
import com.josvier.simplebank.security.actor.CurrentActor;
import com.josvier.simplebank.security.authorization.BankAuthorizationService;
import com.josvier.simplebank.security.authorization.RolePermissions;
import com.josvier.simplebank.service.AccountService;
import com.josvier.simplebank.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/me")
@PreAuthorize("hasRole('CUSTOMER')")
public class CustomerPortalController {

    private final BankAuthorizationService authorization;
    private final UserService userService;
    private final AccountService accountService;

    public CustomerPortalController(BankAuthorizationService authorization,
                                    UserService userService,
                                    AccountService accountService) {
        this.authorization = authorization;
        this.userService = userService;
        this.accountService = accountService;
    }

    @GetMapping
    public ResponseEntity<CustomerMeResponse> me() {
        CurrentActor actor = authorization.currentActor();
        String role = RolePermissions.effectiveRole(actor.primaryRole()).name();
        if (actor.bankUserId() == null) {
            return ResponseEntity.ok(new CustomerMeResponse(actor.username(), role, false, null));
        }
        UserResponse user = userService.getUser(actor.bankUserId());
        return ResponseEntity.ok(new CustomerMeResponse(actor.username(), role, true, profile(user)));
    }

    @GetMapping("/accounts")
    public ResponseEntity<List<CustomerAccountResponse>> accounts() {
        CurrentActor actor = authorization.currentActor();
        String bankUserId = authorization.requireCustomerLink(actor);
        return ResponseEntity.ok(accountService.getAccountsByUser(bankUserId).stream()
                .map(CustomerPortalController::account)
                .toList());
    }

    @GetMapping("/accounts/{accountId}")
    public ResponseEntity<CustomerAccountResponse> account(@PathVariable String accountId) {
        return ResponseEntity.ok(account(accountService.getAccount(accountId)));
    }

    @GetMapping("/accounts/{accountId}/transactions")
    public ResponseEntity<List<CustomerTransactionResponse>> transactions(@PathVariable String accountId) {
        return ResponseEntity.ok(accountService.getTransactions(accountId).stream()
                .map(CustomerPortalController::transaction)
                .toList());
    }

    @PutMapping("/profile")
    public ResponseEntity<CustomerProfileResponse> updateProfile(@Valid @RequestBody UpdateUserRequest request) {
        CurrentActor actor = authorization.currentActor();
        UserResponse user = userService.updateUser(authorization.requireCustomerLink(actor), request);
        return ResponseEntity.ok(profile(user));
    }

    @PostMapping("/transfers/preview")
    public ResponseEntity<TransferPreviewResponse> previewTransfer(@Valid @RequestBody CustomerTransferRequest request) {
        return ResponseEntity.ok(accountService.previewCustomerTransfer(request));
    }

    @PostMapping("/transfers")
    public ResponseEntity<CustomerTransferReceiptResponse> transfer(@Valid @RequestBody CustomerTransferRequest request) {
        return ResponseEntity.ok(accountService.submitCustomerTransfer(request));
    }

    private static CustomerProfileResponse profile(UserResponse user) {
        return new CustomerProfileResponse(user.name(), user.email(), user.createdAt());
    }

    private static CustomerAccountResponse account(AccountResponse account) {
        return new CustomerAccountResponse(
                account.accountId(), account.accountType(), account.balance(), account.createdAt(), account.accountNumber());
    }

    private static CustomerTransactionResponse transaction(TransactionResponse transaction) {
        return new CustomerTransactionResponse(
                transaction.transactionId(), transaction.accountId(), transaction.type(),
                transaction.amount(), transaction.createdAt(), transaction.transferReference(),
                transaction.counterpartyAccountNumberMasked(), transaction.counterpartyDisplayName());
    }
}
