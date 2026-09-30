package com.josvier.simplebank.demo;

import com.josvier.simplebank.auth.PasswordPolicy;
import com.josvier.simplebank.auth.model.AuthRole;
import com.josvier.simplebank.demo.DemoIdentity.DemoAccountPlan;
import com.josvier.simplebank.model.AccountType;

import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class DemoCredentialsParser {

    private static final Pattern ACCOUNT = Pattern.compile("(CHECKING|SAVINGS):(\\d+\\.\\d{2})");

    private DemoCredentialsParser() {
    }

    public static List<DemoIdentity> parse(Path file) {
        try {
            return parse(Files.readAllLines(file));
        } catch (java.io.IOException exception) {
            throw new IllegalStateException("Demo credential file could not be read", exception);
        }
    }

    public static List<DemoIdentity> parse(List<String> lines) {
        List<DemoIdentity> identities = new ArrayList<>();
        Set<String> usernames = new HashSet<>();
        Set<String> emails = new HashSet<>();
        for (String raw : lines) {
            String line = raw.trim();
            if (line.isEmpty() || line.startsWith("=") || !line.contains("|")) continue;
            String[] parts = line.split("\\|");
            if (parts.length != 6) continue;
            String roleName = parts[0].trim();
            if (!isRole(roleName)) continue;
            AuthRole role = AuthRole.valueOf(roleName);
            String name = parts[1].trim();
            String username = parts[2].trim();
            String email = parts[3].trim();
            String password = parts[4].trim();
            String accounts = parts[5].trim();
            if (name.isBlank() || username.isBlank() || email.isBlank()) {
                throw new IllegalStateException("Demo identity is missing a name, username, or email");
            }
            if (password.length() < 8 || PasswordPolicy.exceedsUtf8Limit(password)) {
                throw new IllegalStateException("Demo password does not meet the password policy");
            }
            if (!usernames.add(username) || !emails.add(email)) {
                throw new IllegalStateException("Demo usernames and emails must be unique");
            }
            List<DemoAccountPlan> plans = accountsFor(role, accounts);
            identities.add(new DemoIdentity(role, name, username, email, password, plans));
        }
        if (identities.size() != 20) {
            throw new IllegalStateException("Demo credential file must contain exactly 20 identities");
        }
        return List.copyOf(identities);
    }

    private static boolean isRole(String value) {
        for (AuthRole role : AuthRole.values()) {
            if (role.name().equals(value) && role != AuthRole.USER) return true;
        }
        return false;
    }

    private static List<DemoAccountPlan> accountsFor(AuthRole role, String accounts) {
        if (role != AuthRole.CUSTOMER) {
            if (!"NONE".equals(accounts)) {
                throw new IllegalStateException("Staff demo identities must not own accounts");
            }
            return List.of();
        }
        if ("NONE".equals(accounts) || accounts.isBlank()) {
            throw new IllegalStateException("Customer demo identities must declare accounts");
        }
        List<DemoAccountPlan> plans = new ArrayList<>();
        Matcher matcher = ACCOUNT.matcher(accounts);
        while (matcher.find()) {
            plans.add(new DemoAccountPlan(AccountType.valueOf(matcher.group(1)), new BigDecimal(matcher.group(2))));
        }
        if (plans.isEmpty()) {
            throw new IllegalStateException("Customer account plan is invalid");
        }
        return List.copyOf(plans);
    }
}
