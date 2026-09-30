package com.josvier.simplebank.security.authorization;

import com.josvier.simplebank.auth.model.AuthRole;
import com.josvier.simplebank.exception.ResourceNotFoundException;
import com.josvier.simplebank.model.Account;
import com.josvier.simplebank.security.actor.CurrentActor;
import com.josvier.simplebank.security.actor.CurrentActorProvider;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

@Service
public class BankAuthorizationService {

    private final CurrentActorProvider currentActorProvider;

    public BankAuthorizationService(CurrentActorProvider currentActorProvider) {
        this.currentActorProvider = currentActorProvider;
    }

    public CurrentActor currentActor() {
        return currentActorProvider.current();
    }

    public boolean has(CurrentActor actor, BankPermission permission) {
        return RolePermissions.forRole(actor.primaryRole()).contains(permission);
    }

    public void require(CurrentActor actor, BankPermission permission) {
        if (!has(actor, permission)) {
            throw new AccessDeniedException("Access is denied");
        }
    }

    public String requireCustomerLink(CurrentActor actor) {
        if (RolePermissions.effectiveRole(actor.primaryRole()) != AuthRole.CUSTOMER) {
            throw new AccessDeniedException("Customer access is required");
        }
        if (actor.bankUserId() == null || actor.bankUserId().isBlank()) {
            throw new AccessDeniedException("Bank profile connection is pending");
        }
        return actor.bankUserId();
    }

    public void requireReadCustomer(CurrentActor actor, String bankUserId) {
        if (has(actor, BankPermission.CUSTOMER_ANY_READ)) {
            return;
        }
        if (!has(actor, BankPermission.CUSTOMER_SELF_READ)
                || actor.bankUserId() == null
                || !actor.bankUserId().equals(bankUserId)) {
            hideResource();
        }
    }

    public void requireUpdateCustomer(CurrentActor actor, String bankUserId) {
        if (has(actor, BankPermission.CUSTOMER_UPDATE_ANY)) {
            return;
        }
        if (!has(actor, BankPermission.CUSTOMER_UPDATE_SELF)
                || actor.bankUserId() == null
                || !actor.bankUserId().equals(bankUserId)) {
            hideResource();
        }
    }

    public void requireReadAccount(CurrentActor actor, Account account) {
        if (has(actor, BankPermission.ACCOUNT_ANY_READ)) {
            return;
        }
        if (!has(actor, BankPermission.ACCOUNT_SELF_READ)
                || actor.bankUserId() == null
                || !actor.bankUserId().equals(account.getUserId())) {
            hideResource();
        }
    }

    public void requireReadTransactions(CurrentActor actor, Account account) {
        if (has(actor, BankPermission.TRANSACTION_ANY_READ)) {
            return;
        }
        if (!has(actor, BankPermission.TRANSACTION_SELF_READ)
                || actor.bankUserId() == null
                || !actor.bankUserId().equals(account.getUserId())) {
            hideResource();
        }
    }

    public void requireTransfer(CurrentActor actor, Account from, Account to) {
        if (has(actor, BankPermission.TRANSFER_ANY)) {
            return;
        }
        if (!has(actor, BankPermission.TRANSFER_SELF)
                || actor.bankUserId() == null
                || !actor.bankUserId().equals(from.getUserId())
                || !actor.bankUserId().equals(to.getUserId())) {
            hideResource();
        }
    }

    public boolean isCustomer(CurrentActor actor) {
        return RolePermissions.effectiveRole(actor.primaryRole()) == AuthRole.CUSTOMER;
    }

    public ResourceNotFoundException hiddenResource() {
        return new ResourceNotFoundException("Resource not found");
    }

    private void hideResource() {
        throw hiddenResource();
    }
}
