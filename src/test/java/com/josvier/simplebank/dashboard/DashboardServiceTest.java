package com.josvier.simplebank.dashboard;

import com.josvier.simplebank.auth.model.AuthRole;
import com.josvier.simplebank.auth.model.AuthUser;
import com.josvier.simplebank.auth.repository.AuthUserRepository;
import com.josvier.simplebank.dashboard.dto.AdminDashboardResponse;
import com.josvier.simplebank.dashboard.dto.AuditorDashboardResponse;
import com.josvier.simplebank.dashboard.dto.CustomerDashboardResponse;
import com.josvier.simplebank.dashboard.dto.ManagerDashboardResponse;
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
import com.josvier.simplebank.security.audit.SecurityAuditAction;
import com.josvier.simplebank.security.audit.SecurityAuditRepository;
import com.josvier.simplebank.security.authorization.BankAuthorizationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-09-30T15:00:00Z"), ZoneOffset.UTC);
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 9, 30, 15, 0);

    @Mock BankAuthorizationService authorization;
    @Mock UserRepository users;
    @Mock AccountRepository accounts;
    @Mock TransactionRepository transactions;
    @Mock AuditRepository audits;
    @Mock AuthUserRepository authUsers;
    @Mock SecurityAuditRepository securityAudits;

    private DashboardService service;

    @BeforeEach
    void setUp() {
        service = new DashboardService(
                authorization, users, accounts, transactions, audits, authUsers, securityAudits, CLOCK);
    }

    @Test
    void customerDashboardUsesOnlyLinkedCustomerAccountsAndTransactions() {
        when(authorization.currentActor()).thenReturn(actor("auth-a", "customer-a", AuthRole.CUSTOMER, "customer-a"));
        when(users.findById("customer-a")).thenReturn(Optional.of(user("customer-a", "Customer A")));
        Account own = account("account-a", "customer-a", "125.00", AccountType.CHECKING);
        when(accounts.findByUserId("customer-a")).thenReturn(List.of(own));
        Transaction ownTransaction = transaction("transaction-a", "account-a", TransactionType.DEPOSIT, "25.00", NOW.minusDays(1));
        when(transactions.findByAccountIdInAndCreatedAtBetween(
                List.of("account-a"), NOW.minusDays(30), NOW)).thenReturn(List.of(ownTransaction));

        CustomerDashboardResponse response = (CustomerDashboardResponse) service.getDashboard();

        assertThat(response.totalBalance()).isEqualByComparingTo("125.00");
        assertThat(response.accounts()).extracting(account -> account.accountId()).containsExactly("account-a");
        assertThat(response.recentTransactions()).extracting(transaction -> transaction.accountSuffix()).containsExactly("nt-a");
        assertThat(response.toString()).doesNotContain("customer-b", "account-b", "transaction-b");
        verify(accounts, never()).findAll();
        verify(transactions, never()).findByAccountId("account-b");
    }

    @Test
    void tellerDashboardScopesRecentOperationsToCurrentActor() {
        when(authorization.currentActor()).thenReturn(actor("teller-a-id", "teller-a", AuthRole.TELLER, null));
        when(users.count()).thenReturn(12L);
        when(accounts.count()).thenReturn(21L);
        when(accounts.countByCreatedAtBetween(NOW.toLocalDate().atStartOfDay(), NOW)).thenReturn(2L);
        AuditRecord tellerA = audit(AuditAction.DEPOSIT, "customer-a", "teller-a-id", "teller-a", "50.00", NOW.minusHours(1));
        when(audits.findByActorAuthUserIdAndCreatedAtBetween("teller-a-id", NOW.minusDays(30), NOW)).thenReturn(List.of(tellerA));
        when(users.findById("customer-a")).thenReturn(Optional.of(user("customer-a", "Customer A")));

        TellerDashboardResponse response = (TellerDashboardResponse) service.getDashboard();

        assertThat(response.myOperationsToday()).isEqualTo(1);
        assertThat(response.myDepositsTodayAmount()).isEqualByComparingTo("50.00");
        assertThat(response.myRecentOperations()).extracting(operation -> operation.actorUsername()).containsExactly("teller-a");
        verify(audits).findByActorAuthUserIdAndCreatedAtBetween("teller-a-id", NOW.minusDays(30), NOW);
        verify(audits, never()).findAll();
    }

    @Test
    void managerDashboardUsesExactBigDecimalAuditAggregatesAndAccountMix() {
        when(authorization.currentActor()).thenReturn(actor("manager-id", "manager", AuthRole.MANAGER, null));
        when(users.count()).thenReturn(2L);
        when(accounts.findAll()).thenReturn(List.of(
                account("checking", "customer-a", "1200.10", AccountType.CHECKING),
                account("savings", "customer-b", "99.90", AccountType.SAVINGS)));
        List<AuditRecord> records = List.of(
                audit(AuditAction.DEPOSIT, "customer-a", "teller", "teller", "10.10", NOW.minusDays(3)),
                audit(AuditAction.WITHDRAW, "customer-a", "teller", "teller", "2.05", NOW.minusDays(2)),
                audit(AuditAction.TRANSFER, "customer-b", "manager-id", "manager", "3.15", NOW.minusDays(1)));
        when(audits.findByCreatedAtBetween(NOW.minusDays(30), NOW)).thenReturn(records);
        when(users.findById("customer-a")).thenReturn(Optional.of(user("customer-a", "Customer A")));
        when(users.findById("customer-b")).thenReturn(Optional.of(user("customer-b", "Customer B")));

        ManagerDashboardResponse response = (ManagerDashboardResponse) service.getDashboard();

        assertThat(response.totalBankBalance()).isEqualByComparingTo("1300.00");
        assertThat(response.checkingCount()).isEqualTo(1);
        assertThat(response.savingsCount()).isEqualTo(1);
        assertThat(response.premiumAccountCount()).isEqualTo(1);
        assertThat(response.last30DayDepositVolume()).isEqualByComparingTo("10.10");
        assertThat(response.last30DayWithdrawalVolume()).isEqualByComparingTo("2.05");
        assertThat(response.last30DayTransferVolume()).isEqualByComparingTo("3.15");
    }

    @Test
    void auditorDashboardReturnsReadOnlyBreakdownAndDistinctActors() {
        when(authorization.currentActor()).thenReturn(actor("auditor-id", "auditor", AuthRole.AUDITOR, null));
        when(users.count()).thenReturn(12L);
        when(accounts.count()).thenReturn(21L);
        List<AuditRecord> records = List.of(
                audit(AuditAction.DEPOSIT, "customer-a", "actor-1", "teller-a", "10.00", NOW.minusDays(2)),
                audit(AuditAction.WITHDRAW, "customer-a", "actor-1", "teller-a", "5.00", NOW.minusDays(1)),
                audit(AuditAction.TRANSFER, "customer-b", "actor-2", "manager", "2.00", NOW.minusHours(1)));
        when(audits.findByCreatedAtBetween(NOW.minusDays(30), NOW)).thenReturn(records);
        when(users.findById("customer-a")).thenReturn(Optional.of(user("customer-a", "Customer A")));
        when(users.findById("customer-b")).thenReturn(Optional.of(user("customer-b", "Customer B")));

        AuditorDashboardResponse response = (AuditorDashboardResponse) service.getDashboard();

        assertThat(response.auditRecordsLast30Days()).isEqualTo(3);
        assertThat(response.distinctActorsLast30Days()).isEqualTo(2);
        assertThat(response.depositAuditCount()).isEqualTo(1);
        assertThat(response.withdrawAuditCount()).isEqualTo(1);
        assertThat(response.transferAuditCount()).isEqualTo(1);
        verify(accounts, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void adminDashboardCountsIdentityHealthRolesAndCustomerLinksWithoutCredentials() {
        when(authorization.currentActor()).thenReturn(actor("admin-id", "admin", AuthRole.ADMIN, null));
        List<AuthUser> identities = List.of(
                authUser("customer", AuthRole.CUSTOMER, true, "customer-a"),
                authUser("legacy", AuthRole.USER, true, null),
                authUser("teller", AuthRole.TELLER, false, null),
                authUser("admin", AuthRole.ADMIN, true, null));
        when(authUsers.findAll()).thenReturn(identities);
        when(users.count()).thenReturn(12L);
        when(accounts.count()).thenReturn(21L);
        when(securityAudits.findRecent()).thenReturn(List.of(new SecurityAudit(
                "admin-id", "admin", identities.get(0).getId(), SecurityAuditAction.CUSTOMER_LINKED,
                null, "customer-a", NOW.minusMinutes(5))));
        when(audits.findByCreatedAtBetween(NOW.minusDays(30), NOW)).thenReturn(List.of());

        AdminDashboardResponse response = (AdminDashboardResponse) service.getDashboard();

        assertThat(response.activeAuthUsers()).isEqualTo(3);
        assertThat(response.disabledAuthUsers()).isEqualTo(1);
        assertThat(response.linkedCustomerIdentities()).isEqualTo(1);
        assertThat(response.unlinkedCustomerIdentities()).isEqualTo(1);
        assertThat(response.roleDistribution()).extracting(value -> value.count()).containsExactly(2L, 1L, 0L, 0L, 1L);
        assertThat(response.recentSecurityAudits()).extracting(value -> value.targetUsername()).containsExactly("customer");
        assertThat(response.toString()).doesNotContain("password", "hash");
    }

    private static CurrentActor actor(String id, String username, AuthRole role, String bankUserId) {
        return new CurrentActor(id, username, role, bankUserId);
    }

    private static User user(String id, String name) {
        User user = new User(name, name.toLowerCase().replace(' ', '.') + "@example.com", NOW.minusYears(1));
        user.setId(id);
        return user;
    }

    private static Account account(String id, String userId, String balance, AccountType type) {
        Account account = new Account(userId, new BigDecimal(balance), type, NOW.minusMonths(1));
        account.setId(id);
        return account;
    }

    private static Transaction transaction(String id, String accountId, TransactionType type,
                                           String amount, LocalDateTime createdAt) {
        Transaction transaction = new Transaction(accountId, type, new BigDecimal(amount), createdAt);
        transaction.setId(id);
        return transaction;
    }

    private static AuditRecord audit(AuditAction action, String userId, String actorId,
                                     String actorUsername, String amount, LocalDateTime createdAt) {
        AuditRecord audit = new AuditRecord(
                action, userId, List.of("account-" + userId), List.of(userId), new BigDecimal(amount),
                List.of("transaction-1"), createdAt, actorId, actorUsername);
        audit.setId("audit-" + action + '-' + createdAt);
        return audit;
    }

    private static AuthUser authUser(String username, AuthRole role, boolean enabled, String bankUserId) {
        AuthUser user = new AuthUser(
                username, username + "@example.com", "never-serialized", Set.of(role), enabled, NOW.minusYears(1), bankUserId);
        user.setId("auth-" + username);
        return user;
    }
}
