package com.josvier.simplebank.auth.service;

import com.josvier.simplebank.auth.model.AuthRole;
import com.josvier.simplebank.auth.model.AuthUser;
import com.josvier.simplebank.auth.repository.AuthUserRepository;
import com.josvier.simplebank.exception.ResourceConflictException;
import com.josvier.simplebank.model.User;
import com.josvier.simplebank.repository.UserRepository;
import com.josvier.simplebank.security.actor.CurrentActor;
import com.josvier.simplebank.security.audit.SecurityAudit;
import com.josvier.simplebank.security.audit.SecurityAuditAction;
import com.josvier.simplebank.security.audit.SecurityAuditRepository;
import com.josvier.simplebank.security.authorization.BankAuthorizationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.security.access.AccessDeniedException;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminAuthUserServiceTest {
    private static final String AUTH_ID = "68dc1234567890abcdef0101";
    private static final String BANK_ID = "68dc1234567890abcdef0001";
    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-09-30T15:00:00Z"), ZoneOffset.UTC);

    @Mock AuthUserRepository authUsers;
    @Mock UserRepository bankUsers;
    @Mock SecurityAuditRepository audits;

    private AdminAuthUserService service;

    @BeforeEach
    void setUp() {
        BankAuthorizationService authorization = new BankAuthorizationService(
                () -> new CurrentActor("admin-id", "admin", AuthRole.ADMIN, null));
        service = new AdminAuthUserService(authUsers, bankUsers, audits, authorization, CLOCK);
        lenient().when(authUsers.save(any(AuthUser.class))).thenAnswer(invocation -> invocation.getArgument(0));
        lenient().when(audits.save(any(SecurityAudit.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void roleChangeWritesSecurityAudit() {
        AuthUser target = authUser(AuthRole.TELLER, null, true);
        when(authUsers.findById(AUTH_ID)).thenReturn(Optional.of(target));

        var response = service.changeRole(AUTH_ID, AuthRole.MANAGER);

        assertEquals("MANAGER", response.role());
        ArgumentCaptor<SecurityAudit> captor = ArgumentCaptor.forClass(SecurityAudit.class);
        verify(audits).save(captor.capture());
        assertEquals(SecurityAuditAction.ROLE_CHANGED, captor.getValue().getAction());
        assertEquals("TELLER", captor.getValue().getPreviousValue());
        assertEquals("MANAGER", captor.getValue().getNewValue());
    }

    @Test
    void changingCustomerToStaffClearsLinkAndAuditsBothChanges() {
        AuthUser target = authUser(AuthRole.CUSTOMER, BANK_ID, true);
        when(authUsers.findById(AUTH_ID)).thenReturn(Optional.of(target));

        var response = service.changeRole(AUTH_ID, AuthRole.TELLER);

        assertNull(response.bankUserId());
        ArgumentCaptor<SecurityAudit> captor = ArgumentCaptor.forClass(SecurityAudit.class);
        verify(audits, org.mockito.Mockito.times(2)).save(captor.capture());
        assertEquals(List.of(SecurityAuditAction.ROLE_CHANGED, SecurityAuditAction.CUSTOMER_UNLINKED),
                captor.getAllValues().stream().map(SecurityAudit::getAction).toList());
    }

    @Test
    void linkCustomerIsIntentionalUniqueAndAudited() {
        AuthUser target = authUser(AuthRole.CUSTOMER, null, true);
        User bankUser = new User("Customer A", "a@example.com", LocalDateTime.now(CLOCK));
        bankUser.setId(BANK_ID);
        when(authUsers.findById(AUTH_ID)).thenReturn(Optional.of(target));
        when(bankUsers.findById(BANK_ID)).thenReturn(Optional.of(bankUser));

        var response = service.linkCustomer(AUTH_ID, BANK_ID);

        assertEquals(BANK_ID, response.bankUserId());
        verify(audits).save(org.mockito.ArgumentMatchers.argThat(
                audit -> audit.getAction() == SecurityAuditAction.CUSTOMER_LINKED));
    }

    @Test
    void duplicateCustomerLinkIsRejected() {
        AuthUser target = authUser(AuthRole.CUSTOMER, null, true);
        AuthUser existing = authUser(AuthRole.CUSTOMER, BANK_ID, true);
        existing.setId("68dc1234567890abcdef0102");
        User bankUser = new User("Customer A", "a@example.com", LocalDateTime.now(CLOCK));
        bankUser.setId(BANK_ID);
        when(authUsers.findById(AUTH_ID)).thenReturn(Optional.of(target));
        when(bankUsers.findById(BANK_ID)).thenReturn(Optional.of(bankUser));
        when(authUsers.findByBankUserId(BANK_ID)).thenReturn(Optional.of(existing));

        assertThrows(ResourceConflictException.class, () -> service.linkCustomer(AUTH_ID, BANK_ID));
        verify(authUsers, never()).save(target);
    }

    @Test
    void lastActiveAdminCannotBeDisabled() {
        AuthUser target = authUser(AuthRole.ADMIN, null, true);
        when(authUsers.findById(AUTH_ID)).thenReturn(Optional.of(target));
        when(authUsers.countEnabledByRole(AuthRole.ADMIN)).thenReturn(1L);

        assertThrows(ResourceConflictException.class, () -> service.changeEnabled(AUTH_ID, false));
        assertTrue(target.isEnabled());
    }

    @Test
    void administratorCanDisableIdentityWhenAnotherAdminRemains() {
        AuthUser target = authUser(AuthRole.ADMIN, null, true);
        when(authUsers.findById(AUTH_ID)).thenReturn(Optional.of(target));
        when(authUsers.countEnabledByRole(AuthRole.ADMIN)).thenReturn(2L);

        var response = service.changeEnabled(AUTH_ID, false);

        assertFalse(response.enabled());
        verify(audits).save(org.mockito.ArgumentMatchers.argThat(
                audit -> audit.getAction() == SecurityAuditAction.AUTH_USER_DISABLED));
    }

    @Test
    void nonAdminCannotInvokeServiceEvenWithoutController() {
        BankAuthorizationService authorization = new BankAuthorizationService(
                () -> new CurrentActor("auditor-id", "auditor", AuthRole.AUDITOR, null));
        AdminAuthUserService denied = new AdminAuthUserService(authUsers, bankUsers, audits, authorization, CLOCK);

        assertThrows(AccessDeniedException.class, denied::getUsers);
    }

    @Test
    void bootstrapPromotesExistingIdentityOnlyWhenNoAdminExists() throws Exception {
        AuthUser target = authUser(AuthRole.CUSTOMER, BANK_ID, true);
        when(authUsers.findByUsername("bootstrap-user")).thenReturn(Optional.of(target));
        AdminBootstrapRunner runner = new AdminBootstrapRunner(authUsers, audits, " Bootstrap-User ", CLOCK);

        runner.run(new DefaultApplicationArguments(new String[0]));

        assertEquals(AuthRole.ADMIN, target.getPrimaryRole());
        assertNull(target.getBankUserId());
        verify(audits).save(org.mockito.ArgumentMatchers.argThat(
                audit -> audit.getAction() == SecurityAuditAction.ADMIN_BOOTSTRAPPED));
    }

    @Test
    void bootstrapDoesNothingWhenAnEnabledAdminAlreadyExists() throws Exception {
        when(authUsers.countEnabledByRole(AuthRole.ADMIN)).thenReturn(1L);
        AdminBootstrapRunner runner = new AdminBootstrapRunner(authUsers, audits, "bootstrap-user", CLOCK);

        runner.run(new DefaultApplicationArguments(new String[0]));

        verify(authUsers, never()).findByUsername(any());
        verify(audits, never()).save(any());
    }

    private static AuthUser authUser(AuthRole role, String bankUserId, boolean enabled) {
        AuthUser user = new AuthUser("target", "target@example.com", "never-serialized-hash",
                Set.of(role), enabled, LocalDateTime.now(CLOCK), bankUserId);
        user.setId(AUTH_ID);
        return user;
    }
}
