package com.josvier.simplebank.security.authorization;

import com.josvier.simplebank.auth.model.AuthRole;

import java.util.EnumSet;
import java.util.Set;

import static com.josvier.simplebank.security.authorization.BankPermission.*;

public final class RolePermissions {

    private RolePermissions() {
    }

    public static AuthRole effectiveRole(AuthRole storedRole) {
        return storedRole == AuthRole.USER ? AuthRole.CUSTOMER : storedRole;
    }

    public static Set<BankPermission> forRole(AuthRole storedRole) {
        AuthRole role = effectiveRole(storedRole);
        return switch (role) {
            case CUSTOMER -> EnumSet.of(
                    CUSTOMER_SELF_READ, CUSTOMER_UPDATE_SELF,
                    ACCOUNT_SELF_READ, TRANSACTION_SELF_READ, TRANSFER_SELF);
            case TELLER -> EnumSet.of(
                    CUSTOMER_ANY_READ, CUSTOMER_CREATE,
                    ACCOUNT_ANY_READ, ACCOUNT_CREATE, TRANSACTION_ANY_READ,
                    DEPOSIT_EXECUTE, WITHDRAW_EXECUTE);
            case MANAGER -> EnumSet.of(
                    CUSTOMER_ANY_READ, CUSTOMER_CREATE, CUSTOMER_UPDATE_ANY, CUSTOMER_DELETE,
                    ACCOUNT_ANY_READ, ACCOUNT_CREATE, ACCOUNT_UPDATE, ACCOUNT_DELETE,
                    TRANSACTION_ANY_READ, DEPOSIT_EXECUTE, WITHDRAW_EXECUTE, TRANSFER_ANY,
                    PREMIUM_ACCOUNT_READ, AUDIT_READ);
            case AUDITOR -> EnumSet.of(
                    CUSTOMER_ANY_READ, ACCOUNT_ANY_READ, TRANSACTION_ANY_READ,
                    PREMIUM_ACCOUNT_READ, AUDIT_READ);
            case ADMIN -> EnumSet.allOf(BankPermission.class);
            case USER -> throw new IllegalStateException("USER is normalized before permission lookup");
        };
    }
}
