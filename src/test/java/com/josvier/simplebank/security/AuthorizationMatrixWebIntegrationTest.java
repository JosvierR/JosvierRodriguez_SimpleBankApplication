package com.josvier.simplebank.security;

import com.josvier.simplebank.auth.model.AuthRole;
import com.josvier.simplebank.auth.model.AuthUser;
import com.josvier.simplebank.auth.repository.AuthUserRepository;
import com.josvier.simplebank.auth.service.AdminAuthUserService;
import com.josvier.simplebank.controller.AccountController;
import com.josvier.simplebank.controller.AdminAccessController;
import com.josvier.simplebank.controller.AuditController;
import com.josvier.simplebank.controller.CustomerPortalController;
import com.josvier.simplebank.controller.UserController;
import com.josvier.simplebank.dashboard.DashboardController;
import com.josvier.simplebank.dashboard.DashboardService;
import com.josvier.simplebank.exception.GlobalExceptionHandler;
import com.josvier.simplebank.model.Account;
import com.josvier.simplebank.model.AccountType;
import com.josvier.simplebank.model.AuditRecord;
import com.josvier.simplebank.model.Transaction;
import com.josvier.simplebank.model.TransactionType;
import com.josvier.simplebank.model.User;
import com.josvier.simplebank.repository.AccountRepository;
import com.josvier.simplebank.repository.AuditRepository;
import com.josvier.simplebank.repository.TransactionRepository;
import com.josvier.simplebank.repository.UserRepository;
import com.josvier.simplebank.security.actor.SecurityContextCurrentActorProvider;
import com.josvier.simplebank.security.audit.SecurityAuditRepository;
import com.josvier.simplebank.security.authorization.BankAuthorizationService;
import com.josvier.simplebank.security.config.SecurityConfiguration;
import com.josvier.simplebank.security.filter.SecurityErrorWriter;
import com.josvier.simplebank.security.jwt.JwtService;
import com.josvier.simplebank.security.service.CustomUserDetailsService;
import com.josvier.simplebank.service.impl.AccountServiceImpl;
import com.josvier.simplebank.service.impl.AuditServiceImpl;
import com.josvier.simplebank.service.impl.UserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {
        UserController.class, AccountController.class, AuditController.class,
        CustomerPortalController.class, AdminAccessController.class, DashboardController.class
})
@Import({
        SecurityConfiguration.class, JwtService.class, CustomUserDetailsService.class,
        SecurityContextCurrentActorProvider.class, BankAuthorizationService.class,
        AccountServiceImpl.class, UserServiceImpl.class, AuditServiceImpl.class,
        AdminAuthUserService.class, DashboardService.class, SecurityErrorWriter.class, GlobalExceptionHandler.class
})
class AuthorizationMatrixWebIntegrationTest {
    private static final String CUSTOMER_A = "68dc1234567890abcdef0001";
    private static final String CUSTOMER_B = "68dc1234567890abcdef0002";
    private static final String ACCOUNT_A1 = "68dc1234567890abcdef0011";
    private static final String ACCOUNT_A2 = "68dc1234567890abcdef0012";
    private static final String ACCOUNT_B1 = "68dc1234567890abcdef0021";

    @Autowired MockMvc mockMvc;
    @Autowired JwtService jwtService;
    @Autowired CustomUserDetailsService userDetailsService;

    @MockitoBean AuthUserRepository authUsers;
    @MockitoBean UserRepository users;
    @MockitoBean AccountRepository accounts;
    @MockitoBean TransactionRepository transactions;
    @MockitoBean AuditRepository audits;
    @MockitoBean SecurityAuditRepository securityAudits;

    private User customerA;
    private User customerB;
    private Account accountA1;
    private Account accountA2;
    private Account accountB1;

    @BeforeEach
    void fixtures() {
        customerA = user(CUSTOMER_A, "Customer A", "a@example.com");
        customerB = user(CUSTOMER_B, "Customer B", "b@example.com");
        accountA1 = account(ACCOUNT_A1, CUSTOMER_A, "500.00");
        accountA2 = account(ACCOUNT_A2, CUSTOMER_A, "100.00");
        accountB1 = account(ACCOUNT_B1, CUSTOMER_B, "250.00");

        when(users.findById(CUSTOMER_A)).thenReturn(Optional.of(customerA));
        when(users.findById(CUSTOMER_B)).thenReturn(Optional.of(customerB));
        when(users.findAll()).thenReturn(List.of(customerA, customerB));
        when(users.count()).thenReturn(2L);
        when(users.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        when(accounts.findById(ACCOUNT_A1)).thenReturn(Optional.of(accountA1));
        when(accounts.findById(ACCOUNT_A2)).thenReturn(Optional.of(accountA2));
        when(accounts.findById(ACCOUNT_B1)).thenReturn(Optional.of(accountB1));
        when(accounts.findByIdAndUserId(ACCOUNT_A1, CUSTOMER_A)).thenReturn(Optional.of(accountA1));
        when(accounts.findByIdAndUserId(ACCOUNT_A2, CUSTOMER_A)).thenReturn(Optional.of(accountA2));
        when(accounts.findByIdAndUserId(ACCOUNT_B1, CUSTOMER_B)).thenReturn(Optional.of(accountB1));
        when(accounts.findByUserId(CUSTOMER_A)).thenReturn(List.of(accountA1, accountA2));
        when(accounts.findByUserId(CUSTOMER_B)).thenReturn(List.of(accountB1));
        when(accounts.findAll()).thenReturn(List.of(accountA1, accountA2, accountB1));
        when(accounts.count()).thenReturn(3L);
        when(accounts.countByCreatedAtBetween(any(LocalDateTime.class), any(LocalDateTime.class))).thenReturn(0L);
        when(accounts.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Transaction aTransaction = transaction("68dc1234567890abcdef0101", ACCOUNT_A1);
        Transaction bTransaction = transaction("68dc1234567890abcdef0102", ACCOUNT_B1);
        when(transactions.findByAccountId(ACCOUNT_A1)).thenReturn(List.of(aTransaction));
        when(transactions.findByAccountId(ACCOUNT_B1)).thenReturn(List.of(bTransaction));
        when(transactions.findByAccountIdInAndCreatedAtBetween(anyList(), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenAnswer(invocation -> {
                    List<String> accountIds = invocation.getArgument(0);
                    return accountIds.contains(ACCOUNT_B1) ? List.of(bTransaction) : List.of(aTransaction);
                });
        AtomicInteger ids = new AtomicInteger(200);
        when(transactions.save(any(Transaction.class))).thenAnswer(invocation -> {
            Transaction transaction = invocation.getArgument(0);
            transaction.setId("68dc1234567890abcdef0" + ids.getAndIncrement());
            return transaction;
        });
        when(securityAudits.findAll()).thenReturn(List.of());
        when(audits.findByCreatedAtBetween(any(LocalDateTime.class), any(LocalDateTime.class))).thenReturn(List.of());
        when(audits.findByActorAuthUserIdAndCreatedAtBetween(
                anyString(), any(LocalDateTime.class), any(LocalDateTime.class))).thenReturn(List.of());
        when(audits.save(any(AuditRecord.class))).thenAnswer(invocation -> {
            AuditRecord audit = invocation.getArgument(0);
            audit.setId("68dc1234567890abcdef0999");
            return audit;
        });
    }

    @Test
    void customerCanReadOnlyOwnProfileAccountsAndTransactions() throws Exception {
        String token = token("customer-a", AuthRole.CUSTOMER, CUSTOMER_A);
        request(get("/api/me"), token).andExpect(status().isOk())
                .andExpect(jsonPath("$.profile.name").value("Customer A"));
        request(get("/api/me/accounts"), token).andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
        request(get("/api/me/accounts/" + ACCOUNT_A1), token).andExpect(status().isOk());
        request(get("/api/me/accounts/" + ACCOUNT_A1 + "/transactions"), token)
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void customerDashboardCannotContainAnotherCustomersDataOrImpersonateAdmin() throws Exception {
        String token = token("customer-a", AuthRole.CUSTOMER, CUSTOMER_A);
        request(get("/api/dashboard?role=ADMIN"), token)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("CUSTOMER"))
                .andExpect(jsonPath("$.accounts.length()").value(2))
                .andExpect(content().string(not(containsString(ACCOUNT_B1))))
                .andExpect(content().string(not(containsString(CUSTOMER_B))));
    }

    @Test
    void dashboardEndpointReturnsTheServerDerivedTellerView() throws Exception {
        request(get("/api/dashboard"), token("teller", AuthRole.TELLER, null))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("TELLER"))
                .andExpect(jsonPath("$.customerCount").value(2))
                .andExpect(jsonPath("$.recentBankingAudits").doesNotExist());
    }

    @Test
    void dashboardEndpointReturnsTheServerDerivedManagerView() throws Exception {
        request(get("/api/dashboard"), token("manager", AuthRole.MANAGER, null))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("MANAGER"))
                .andExpect(jsonPath("$.accountCount").value(3))
                .andExpect(jsonPath("$.totalBankBalance").value(850.00));
    }

    @Test
    void dashboardEndpointReturnsTheReadOnlyAuditorView() throws Exception {
        request(get("/api/dashboard"), token("auditor", AuthRole.AUDITOR, null))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("AUDITOR"))
                .andExpect(jsonPath("$.auditRecordsLast30Days").value(0))
                .andExpect(jsonPath("$.activeAuthUsers").doesNotExist());
    }

    @Test
    void dashboardEndpointReturnsTheAdminIdentityViewWithoutCredentialFields() throws Exception {
        AuthUser admin = authUser("admin-dashboard", AuthRole.ADMIN, null);
        when(authUsers.findByUsername("admin-dashboard")).thenReturn(Optional.of(admin));
        when(authUsers.findAll()).thenReturn(List.of(admin));
        request(get("/api/dashboard"), jwtService.generateToken(userDetailsService.toUserDetails(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andExpect(jsonPath("$.activeAuthUsers").value(1))
                .andExpect(jsonPath("$.passwordHash").doesNotExist())
                .andExpect(content().string(not(containsString("passwordHash"))));
    }

    @Test
    void customerCannotReadAnotherCustomersProfile() throws Exception {
        request(get("/api/users/" + CUSTOMER_B), token("customer-a", AuthRole.CUSTOMER, CUSTOMER_A))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.message").value("Resource not found"));
    }

    @Test
    void customerCannotReadAnotherCustomersAccount() throws Exception {
        request(get("/api/accounts/" + ACCOUNT_B1), token("customer-a", AuthRole.CUSTOMER, CUSTOMER_A))
                .andExpect(status().isNotFound());
    }

    @Test
    void customerCannotEnumerateOtherTransactions() throws Exception {
        request(get("/api/accounts/" + ACCOUNT_B1 + "/transactions"),
                token("customer-a", AuthRole.CUSTOMER, CUSTOMER_A)).andExpect(status().isNotFound());
    }

    @Test
    void customerCannotWithdrawFromAnotherCustomersAccount() throws Exception {
        request(post("/api/accounts/" + ACCOUNT_B1 + "/withdraw")
                .contentType(MediaType.APPLICATION_JSON).content("{\"amount\":10}"),
                token("customer-a", AuthRole.CUSTOMER, CUSTOMER_A)).andExpect(status().isForbidden());
    }

    @Test
    void customerCannotTransferUsingAnotherCustomersAccount() throws Exception {
        request(post("/api/me/transfers").contentType(MediaType.APPLICATION_JSON)
                .content("{\"fromAccountId\":\"" + ACCOUNT_A1 + "\",\"toAccountId\":\""
                        + ACCOUNT_B1 + "\",\"amount\":10}"),
                token("customer-a", AuthRole.CUSTOMER, CUSTOMER_A)).andExpect(status().isNotFound());
    }

    @Test
    void customerCannotReadGlobalCollectionsOrAdministration() throws Exception {
        String token = token("customer-a", AuthRole.CUSTOMER, CUSTOMER_A);
        request(get("/api/users"), token).andExpect(status().isForbidden());
        request(get("/api/accounts"), token).andExpect(status().isForbidden());
        request(get("/api/audits"), token).andExpect(status().isForbidden());
        request(get("/api/admin/auth-users"), token).andExpect(status().isForbidden());
    }

    @Test
    void customerBReciprocallyCannotReadCustomerAAccount() throws Exception {
        request(get("/api/accounts/" + ACCOUNT_A1), token("customer-b", AuthRole.CUSTOMER, CUSTOMER_B))
                .andExpect(status().isNotFound());
    }

    @Test
    void unlinkedCustomerCanVerifyIdentityButCannotReadBankingData() throws Exception {
        String token = token("pending", AuthRole.CUSTOMER, null);
        request(get("/api/me"), token).andExpect(status().isOk())
                .andExpect(jsonPath("$.bankUserLinked").value(false));
        request(get("/api/me/accounts"), token).andExpect(status().isForbidden());
    }

    @Test
    void legacyUserReceivesCustomerPendingLinkBehavior() throws Exception {
        String token = token("legacy", AuthRole.USER, null);
        request(get("/api/me"), token).andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("CUSTOMER"))
                .andExpect(jsonPath("$.bankUserLinked").value(false));
    }

    @Test
    void tellerCanReadCustomersAndAccountsButNotAuditOrDelete() throws Exception {
        String token = token("teller", AuthRole.TELLER, null);
        request(get("/api/users"), token).andExpect(status().isOk());
        request(get("/api/accounts/" + ACCOUNT_B1), token).andExpect(status().isOk());
        request(get("/api/audits"), token).andExpect(status().isForbidden());
        request(delete("/api/users/" + CUSTOMER_B), token).andExpect(status().isForbidden());
        request(post("/api/accounts/transfer").contentType(MediaType.APPLICATION_JSON)
                .content(transferBody()), token).andExpect(status().isForbidden());
    }

    @Test
    void managerCanUpdateTransferAndReadAuditsButNotManageAuthUsers() throws Exception {
        String token = token("manager", AuthRole.MANAGER, null);
        request(put("/api/users/" + CUSTOMER_B).contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Customer B\",\"email\":\"b@example.com\"}"), token)
                .andExpect(status().isOk());
        request(post("/api/accounts/transfer").contentType(MediaType.APPLICATION_JSON)
                .content(transferBody()), token).andExpect(status().isOk());
        request(get("/api/audits"), token).andExpect(status().isOk());
        request(get("/api/admin/auth-users"), token).andExpect(status().isForbidden());
    }

    @Test
    void auditorIsReadOnly() throws Exception {
        String token = token("auditor", AuthRole.AUDITOR, null);
        request(get("/api/users"), token).andExpect(status().isOk());
        request(get("/api/accounts"), token).andExpect(status().isOk());
        request(get("/api/accounts/" + ACCOUNT_A1 + "/transactions"), token).andExpect(status().isOk());
        request(get("/api/audits"), token).andExpect(status().isOk());
        request(post("/api/accounts/" + ACCOUNT_A1 + "/deposit")
                .contentType(MediaType.APPLICATION_JSON).content("{\"amount\":10}"), token)
                .andExpect(status().isForbidden());
        request(delete("/api/accounts/" + ACCOUNT_A1), token).andExpect(status().isForbidden());
    }

    @Test
    void adminCanManageIdentitiesWithoutExposingPasswordHash() throws Exception {
        AuthUser admin = authUser("admin", AuthRole.ADMIN, null);
        when(authUsers.findByUsername("admin")).thenReturn(Optional.of(admin));
        when(authUsers.findAll()).thenReturn(List.of(admin));
        request(get("/api/admin/auth-users"), jwtService.generateToken(userDetailsService.toUserDetails(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].username").value("admin"))
                .andExpect(jsonPath("$[0].passwordHash").doesNotExist())
                .andExpect(jsonPath("$[0].password").doesNotExist());
    }

    @Test
    void lastActiveAdminCannotRemoveOwnAdminRole() throws Exception {
        AuthUser admin = authUser("admin", AuthRole.ADMIN, null);
        when(authUsers.findByUsername("admin")).thenReturn(Optional.of(admin));
        when(authUsers.findById(admin.getId())).thenReturn(Optional.of(admin));
        when(authUsers.countEnabledByRole(AuthRole.ADMIN)).thenReturn(1L);
        request(put("/api/admin/auth-users/" + admin.getId() + "/role")
                .contentType(MediaType.APPLICATION_JSON).content("{\"role\":\"MANAGER\"}"),
                jwtService.generateToken(userDetailsService.toUserDetails(admin)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("At least one enabled administrator is required"));
    }

    private org.springframework.test.web.servlet.ResultActions request(
            org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder request, String token)
            throws Exception {
        return mockMvc.perform(request.header("Authorization", "Bearer " + token));
    }

    private String token(String username, AuthRole role, String bankUserId) {
        AuthUser user = authUser(username, role, bankUserId);
        when(authUsers.findByUsername(username)).thenReturn(Optional.of(user));
        return jwtService.generateToken(userDetailsService.toUserDetails(user));
    }

    private AuthUser authUser(String username, AuthRole role, String bankUserId) {
        AuthUser user = new AuthUser(username, username + "@example.com", "hash", Set.of(role), true,
                LocalDateTime.of(2026, 9, 30, 15, 0), bankUserId);
        user.setId("68dc1234567890abcdef" + String.format("%04x", Math.abs(username.hashCode()) % 65536));
        return user;
    }

    private static User user(String id, String name, String email) {
        User user = new User(name, email, LocalDateTime.of(2026, 9, 30, 10, 0));
        user.setId(id);
        return user;
    }

    private static Account account(String id, String userId, String balance) {
        Account account = new Account(userId, new BigDecimal(balance), AccountType.CHECKING,
                LocalDateTime.of(2026, 9, 30, 10, 0));
        account.setId(id);
        return account;
    }

    private static Transaction transaction(String id, String accountId) {
        Transaction transaction = new Transaction(accountId, TransactionType.DEPOSIT,
                new BigDecimal("50.00"), LocalDateTime.of(2026, 9, 30, 11, 0));
        transaction.setId(id);
        return transaction;
    }

    private static String transferBody() {
        return "{\"fromAccountId\":\"" + ACCOUNT_A1 + "\",\"toAccountId\":\""
                + ACCOUNT_B1 + "\",\"amount\":10}";
    }
}
