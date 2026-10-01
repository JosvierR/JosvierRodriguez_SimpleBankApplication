package com.josvier.simplebank.dashboard;

import com.josvier.simplebank.auth.model.AuthRole;
import com.josvier.simplebank.auth.model.AuthUser;
import com.josvier.simplebank.auth.repository.AuthUserRepository;
import com.josvier.simplebank.dashboard.dto.AdminDashboardResponse;
import com.josvier.simplebank.dashboard.dto.AuditorDashboardResponse;
import com.josvier.simplebank.dashboard.dto.CustomerDashboardResponse;
import com.josvier.simplebank.dashboard.dto.DashboardAccountSummary;
import com.josvier.simplebank.dashboard.dto.DashboardActivityPoint;
import com.josvier.simplebank.dashboard.dto.DashboardBankingActivity;
import com.josvier.simplebank.dashboard.dto.DashboardCustomerTransaction;
import com.josvier.simplebank.dashboard.dto.DashboardRoleCount;
import com.josvier.simplebank.dashboard.dto.DashboardSecurityActivity;
import com.josvier.simplebank.dashboard.dto.ManagerDashboardResponse;
import com.josvier.simplebank.dashboard.dto.RoleDashboardResponse;
import com.josvier.simplebank.dashboard.dto.TellerDashboardResponse;
import com.josvier.simplebank.model.Account;
import com.josvier.simplebank.model.AccountType;
import com.josvier.simplebank.model.AuditAction;
import com.josvier.simplebank.model.AuditRecord;
import com.josvier.simplebank.model.Transaction;
import com.josvier.simplebank.model.TransactionType;
import com.josvier.simplebank.model.User;
import com.josvier.simplebank.repository.AccountRepository;
import com.josvier.simplebank.repository.AuditRepository;
import com.josvier.simplebank.repository.TransactionRepository;
import com.josvier.simplebank.repository.UserRepository;
import com.josvier.simplebank.security.actor.CurrentActor;
import com.josvier.simplebank.security.audit.SecurityAudit;
import com.josvier.simplebank.security.audit.SecurityAuditRepository;
import com.josvier.simplebank.security.authorization.BankAuthorizationService;
import com.josvier.simplebank.security.authorization.RolePermissions;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@Service
public class DashboardService {

    static final BigDecimal PREMIUM_BALANCE = new BigDecimal("1000.00");
    private static final BigDecimal ZERO = new BigDecimal("0.00");
    private static final int RECENT_LIMIT = 8;

    private final BankAuthorizationService authorization;
    private final UserRepository users;
    private final AccountRepository accounts;
    private final TransactionRepository transactions;
    private final AuditRepository audits;
    private final AuthUserRepository authUsers;
    private final SecurityAuditRepository securityAudits;
    private final Clock clock;

    public DashboardService(BankAuthorizationService authorization,
                            UserRepository users,
                            AccountRepository accounts,
                            TransactionRepository transactions,
                            AuditRepository audits,
                            AuthUserRepository authUsers,
                            SecurityAuditRepository securityAudits,
                            Clock clock) {
        this.authorization = authorization;
        this.users = users;
        this.accounts = accounts;
        this.transactions = transactions;
        this.audits = audits;
        this.authUsers = authUsers;
        this.securityAudits = securityAudits;
        this.clock = clock;
    }

    public RoleDashboardResponse getDashboard() {
        CurrentActor actor = authorization.currentActor();
        LocalDateTime now = LocalDateTime.now(clock);
        return switch (RolePermissions.effectiveRole(actor.primaryRole())) {
            case CUSTOMER -> customer(actor, now);
            case TELLER -> teller(actor, now);
            case MANAGER -> manager(now);
            case AUDITOR -> auditor(now);
            case ADMIN -> admin(now);
            case USER -> throw new IllegalStateException("Legacy USER must resolve to CUSTOMER");
        };
    }

    private CustomerDashboardResponse customer(CurrentActor actor, LocalDateTime now) {
        if (actor.bankUserId() == null) {
            return new CustomerDashboardResponse(
                    AuthRole.CUSTOMER, now, false, actor.username(), ZERO, 0, List.of(),
                    ZERO, ZERO, List.of(), List.of());
        }
        User customer = users.findById(actor.bankUserId()).orElseThrow(authorization::hiddenResource);
        List<Account> ownedAccounts = accounts.findByUserId(actor.bankUserId());
        List<String> accountIds = ownedAccounts.stream().map(Account::getId).toList();
        List<Transaction> periodTransactions = transactions.findByAccountIdInAndCreatedAtBetween(
                accountIds, now.minusDays(30), now);
        BigDecimal deposits = sumTransactions(periodTransactions, TransactionType.DEPOSIT);
        BigDecimal withdrawals = sumTransactions(periodTransactions, TransactionType.WITHDRAW);
        List<DashboardCustomerTransaction> recent = periodTransactions.stream()
                .sorted(Comparator.comparing(Transaction::getCreatedAt).reversed())
                .limit(RECENT_LIMIT)
                .map(transaction -> new DashboardCustomerTransaction(
                        transaction.getType(), suffix(transaction.getAccountId()),
                        transaction.getAmount(), transaction.getCreatedAt()))
                .toList();
        List<DashboardAccountSummary> summaries = ownedAccounts.stream()
                .sorted(Comparator.comparing(Account::getCreatedAt))
                .map(account -> new DashboardAccountSummary(
                        account.getId(), account.getAccountType(), account.getBalance(), account.getCreatedAt()))
                .toList();
        return new CustomerDashboardResponse(
                AuthRole.CUSTOMER,
                now,
                true,
                customer.getName(),
                sumBalances(ownedAccounts),
                ownedAccounts.size(),
                summaries,
                deposits,
                withdrawals,
                transactionSeries(periodTransactions),
                recent
        );
    }

    private TellerDashboardResponse teller(CurrentActor actor, LocalDateTime now) {
        LocalDateTime today = now.toLocalDate().atStartOfDay();
        List<AuditRecord> recent = audits.findByActorAuthUserIdAndCreatedAtBetween(
                actor.authUserId(), now.minusDays(30), now);
        List<AuditRecord> todayOperations = recent.stream()
                .filter(audit -> !audit.getCreatedAt().isBefore(today))
                .toList();
        return new TellerDashboardResponse(
                AuthRole.TELLER,
                now,
                actor.username(),
                users.count(),
                accounts.count(),
                accounts.countByCreatedAtBetween(today, now),
                todayOperations.size(),
                sumAudits(todayOperations, AuditAction.DEPOSIT),
                sumAudits(todayOperations, AuditAction.WITHDRAW),
                recentBankingActivities(recent)
        );
    }

    private ManagerDashboardResponse manager(LocalDateTime now) {
        List<Account> allAccounts = accounts.findAll();
        List<AuditRecord> periodAudits = audits.findByCreatedAtBetween(now.minusDays(30), now);
        return new ManagerDashboardResponse(
                AuthRole.MANAGER,
                now,
                users.count(),
                allAccounts.size(),
                sumBalances(allAccounts),
                countAccounts(allAccounts, AccountType.CHECKING),
                countAccounts(allAccounts, AccountType.SAVINGS),
                allAccounts.stream().filter(account -> account.getBalance().compareTo(PREMIUM_BALANCE) >= 0).count(),
                sumAudits(periodAudits, AuditAction.DEPOSIT),
                sumAudits(periodAudits, AuditAction.WITHDRAW),
                sumAudits(periodAudits, AuditAction.TRANSFER),
                auditSeries(periodAudits),
                recentBankingActivities(periodAudits)
        );
    }

    private AuditorDashboardResponse auditor(LocalDateTime now) {
        List<AuditRecord> periodAudits = audits.findByCreatedAtBetween(now.minusDays(30), now);
        return new AuditorDashboardResponse(
                AuthRole.AUDITOR,
                now,
                users.count(),
                accounts.count(),
                periodAudits.size(),
                periodAudits.stream().map(AuditRecord::getActorAuthUserId).filter(id -> id != null && !id.isBlank()).distinct().count(),
                countAudits(periodAudits, AuditAction.DEPOSIT),
                countAudits(periodAudits, AuditAction.WITHDRAW),
                countAudits(periodAudits, AuditAction.TRANSFER),
                recentBankingActivities(periodAudits)
        );
    }

    private AdminDashboardResponse admin(LocalDateTime now) {
        List<AuthUser> identities = authUsers.findAll();
        Map<AuthRole, Long> distribution = new EnumMap<>(AuthRole.class);
        for (AuthUser identity : identities) {
            distribution.merge(RolePermissions.effectiveRole(identity.getPrimaryRole()), 1L, Long::sum);
        }
        List<DashboardRoleCount> roleCounts = List.of(
                AuthRole.CUSTOMER, AuthRole.TELLER, AuthRole.MANAGER, AuthRole.AUDITOR, AuthRole.ADMIN).stream()
                .map(role -> new DashboardRoleCount(role, distribution.getOrDefault(role, 0L)))
                .toList();
        long linked = identities.stream()
                .filter(identity -> RolePermissions.effectiveRole(identity.getPrimaryRole()) == AuthRole.CUSTOMER)
                .filter(identity -> identity.getBankUserId() != null)
                .count();
        long unlinked = identities.stream()
                .filter(identity -> RolePermissions.effectiveRole(identity.getPrimaryRole()) == AuthRole.CUSTOMER)
                .filter(identity -> identity.getBankUserId() == null)
                .count();
        Map<String, String> usernamesById = new HashMap<>();
        identities.forEach(identity -> usernamesById.put(identity.getId(), identity.getUsername()));
        List<DashboardSecurityActivity> recentSecurity = securityAudits.findAll().stream()
                .limit(RECENT_LIMIT)
                .map(audit -> securityActivity(audit, usernamesById))
                .toList();
        return new AdminDashboardResponse(
                AuthRole.ADMIN,
                now,
                identities.stream().filter(AuthUser::isEnabled).count(),
                identities.stream().filter(identity -> !identity.isEnabled()).count(),
                roleCounts,
                linked,
                unlinked,
                users.count(),
                accounts.count(),
                recentSecurity,
                recentBankingActivities(audits.findByCreatedAtBetween(now.minusDays(30), now))
        );
    }

    private DashboardSecurityActivity securityActivity(SecurityAudit audit, Map<String, String> usernamesById) {
        return new DashboardSecurityActivity(
                audit.getAction(), audit.getActorUsername(),
                usernamesById.getOrDefault(audit.getTargetAuthUserId(), "Unknown"), audit.getCreatedAt());
    }

    private List<DashboardBankingActivity> recentBankingActivities(List<AuditRecord> records) {
        Map<String, String> customerNames = new HashMap<>();
        records.forEach(audit -> customerNames.computeIfAbsent(
                audit.getUserId(), id -> users.findById(id).map(User::getName).orElse("Unknown")));
        return records.stream()
                .sorted(Comparator.comparing(AuditRecord::getCreatedAt).reversed())
                .limit(RECENT_LIMIT)
                .map(audit -> new DashboardBankingActivity(
                        audit.getAction(),
                        customerNames.get(audit.getUserId()),
                        audit.getActorUsername(),
                        audit.getAccountIds().stream().map(DashboardService::suffix).toList(),
                        audit.getAmount(),
                        audit.getCreatedAt()))
                .toList();
    }

    private static BigDecimal sumBalances(List<Account> values) {
        return values.stream().map(Account::getBalance).reduce(ZERO, BigDecimal::add);
    }

    private static BigDecimal sumTransactions(List<Transaction> values, TransactionType type) {
        return values.stream().filter(value -> value.getType() == type)
                .map(Transaction::getAmount).reduce(ZERO, BigDecimal::add);
    }

    private static BigDecimal sumAudits(List<AuditRecord> values, AuditAction action) {
        return values.stream().filter(value -> value.getAction() == action)
                .map(AuditRecord::getAmount).reduce(ZERO, BigDecimal::add);
    }

    private static long countAudits(List<AuditRecord> values, AuditAction action) {
        return values.stream().filter(value -> value.getAction() == action).count();
    }

    private static long countAccounts(List<Account> values, AccountType type) {
        return values.stream().filter(value -> value.getAccountType() == type).count();
    }

    private static List<DashboardActivityPoint> transactionSeries(List<Transaction> values) {
        Map<LocalDate, MoneyTotals> byDate = new TreeMap<>();
        for (Transaction transaction : values) {
            MoneyTotals totals = byDate.computeIfAbsent(transaction.getCreatedAt().toLocalDate(), ignored -> new MoneyTotals());
            if (transaction.getType() == TransactionType.DEPOSIT) totals.deposits = totals.deposits.add(transaction.getAmount());
            else totals.withdrawals = totals.withdrawals.add(transaction.getAmount());
        }
        return points(byDate);
    }

    private static List<DashboardActivityPoint> auditSeries(List<AuditRecord> values) {
        Map<LocalDate, MoneyTotals> byDate = new TreeMap<>();
        for (AuditRecord audit : values) {
            MoneyTotals totals = byDate.computeIfAbsent(audit.getCreatedAt().toLocalDate(), ignored -> new MoneyTotals());
            switch (audit.getAction()) {
                case DEPOSIT -> totals.deposits = totals.deposits.add(audit.getAmount());
                case WITHDRAW -> totals.withdrawals = totals.withdrawals.add(audit.getAmount());
                case TRANSFER -> totals.transfers = totals.transfers.add(audit.getAmount());
            }
        }
        return points(byDate);
    }

    private static List<DashboardActivityPoint> points(Map<LocalDate, MoneyTotals> values) {
        Map<LocalDate, MoneyTotals> ordered = new LinkedHashMap<>(values);
        return ordered.entrySet().stream()
                .map(entry -> new DashboardActivityPoint(
                        entry.getKey(), entry.getValue().deposits,
                        entry.getValue().withdrawals, entry.getValue().transfers))
                .toList();
    }

    private static String suffix(String id) {
        if (id == null) return "";
        return id.substring(Math.max(0, id.length() - 4));
    }

    private static final class MoneyTotals {
        private BigDecimal deposits = ZERO;
        private BigDecimal withdrawals = ZERO;
        private BigDecimal transfers = ZERO;
    }
}
