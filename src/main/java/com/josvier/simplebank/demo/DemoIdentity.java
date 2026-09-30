package com.josvier.simplebank.demo;

import com.josvier.simplebank.auth.model.AuthRole;
import com.josvier.simplebank.model.AccountType;

import java.math.BigDecimal;
import java.util.List;

public record DemoIdentity(
        AuthRole role,
        String name,
        String username,
        String email,
        String password,
        List<DemoAccountPlan> accounts
) {
    public boolean staff() {
        return role != AuthRole.CUSTOMER;
    }

    public record DemoAccountPlan(AccountType type, BigDecimal balance) {
    }
}
