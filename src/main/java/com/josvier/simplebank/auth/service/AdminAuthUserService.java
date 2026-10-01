package com.josvier.simplebank.auth.service;

import com.josvier.simplebank.auth.AuthIdentityPolicy;
import com.josvier.simplebank.auth.dto.response.AdminAuthUserResponse;
import com.josvier.simplebank.auth.dto.response.SecurityAuditResponse;
import com.josvier.simplebank.auth.model.AuthRole;
import com.josvier.simplebank.auth.model.AuthUser;
import com.josvier.simplebank.auth.repository.AuthUserRepository;
import com.josvier.simplebank.exception.ResourceConflictException;
import com.josvier.simplebank.exception.ResourceNotFoundException;
import com.josvier.simplebank.model.User;
import com.josvier.simplebank.repository.UserRepository;
import com.josvier.simplebank.security.actor.CurrentActor;
import com.josvier.simplebank.security.audit.SecurityAudit;
import com.josvier.simplebank.security.audit.SecurityAuditAction;
import com.josvier.simplebank.security.audit.SecurityAuditRepository;
import com.josvier.simplebank.security.authorization.BankAuthorizationService;
import com.josvier.simplebank.security.authorization.BankPermission;
import com.josvier.simplebank.security.authorization.RolePermissions;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class AdminAuthUserService {
    private final AuthUserRepository authUsers;
    private final UserRepository bankUsers;
    private final SecurityAuditRepository securityAudits;
    private final BankAuthorizationService authorization;
    private final Clock clock;

    public AdminAuthUserService(AuthUserRepository authUsers, UserRepository bankUsers,
                                SecurityAuditRepository securityAudits,
                                BankAuthorizationService authorization, Clock clock) {
        this.authUsers = authUsers;
        this.bankUsers = bankUsers;
        this.securityAudits = securityAudits;
        this.authorization = authorization;
        this.clock = clock;
    }

    public List<AdminAuthUserResponse> getUsers() {
        requireAdmin();
        return authUsers.findAll().stream().map(this::response).toList();
    }

    public AdminAuthUserResponse getUser(String id) {
        requireAdmin();
        return response(find(id));
    }

    @Transactional
    public AdminAuthUserResponse changeRole(String id, AuthRole role) {
        CurrentActor actor = requireAdmin();
        if (role == null || role == AuthRole.USER) {
            throw new ResourceConflictException("Select one current primary role");
        }
        AuthUser target = find(id);
        AuthRole previous = RolePermissions.effectiveRole(target.getPrimaryRole());
        if (previous == role) {
            return response(target);
        }
        AuthIdentityPolicy.requireRoleCompatible(target.getUsername(), role);
        protectLastAdmin(target, role, target.isEnabled());
        String previousLink = target.getBankUserId();
        target.changePrimaryRole(role);
        if (role != AuthRole.CUSTOMER && previousLink != null) {
            target.clearBankUserLink();
        }
        AuthUser saved = authUsers.save(target);
        audit(actor, saved.getId(), SecurityAuditAction.ROLE_CHANGED, previous.name(), role.name());
        if (previousLink != null && role != AuthRole.CUSTOMER) {
            audit(actor, saved.getId(), SecurityAuditAction.CUSTOMER_UNLINKED, previousLink, null);
        }
        return response(saved);
    }

    @Transactional
    public AdminAuthUserResponse changeEnabled(String id, boolean enabled) {
        CurrentActor actor = requireAdmin();
        AuthUser target = find(id);
        if (target.isEnabled() == enabled) {
            return response(target);
        }
        protectLastAdmin(target, target.getPrimaryRole(), enabled);
        target.setEnabled(enabled);
        AuthUser saved = authUsers.save(target);
        audit(actor, saved.getId(), enabled ? SecurityAuditAction.AUTH_USER_ENABLED
                : SecurityAuditAction.AUTH_USER_DISABLED, Boolean.toString(!enabled), Boolean.toString(enabled));
        return response(saved);
    }

    @Transactional
    public AdminAuthUserResponse linkCustomer(String id, String bankUserId) {
        CurrentActor actor = requireAdmin();
        AuthUser target = find(id);
        if (RolePermissions.effectiveRole(target.getPrimaryRole()) != AuthRole.CUSTOMER) {
            throw new ResourceConflictException("Only a CUSTOMER identity can be linked to a bank customer");
        }
        User bankUser = bankUsers.findById(bankUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Bank customer was not found"));
        authUsers.findByBankUserId(bankUserId).ifPresent(existing -> {
            if (!existing.getId().equals(target.getId())) {
                throw new ResourceConflictException("This bank customer already has a linked login");
            }
        });
        String previous = target.getBankUserId();
        target.linkBankUser(bankUser.getId());
        AuthUser saved = authUsers.save(target);
        audit(actor, saved.getId(), SecurityAuditAction.CUSTOMER_LINKED, previous, bankUser.getId());
        return response(saved);
    }

    @Transactional
    public AdminAuthUserResponse unlinkCustomer(String id) {
        CurrentActor actor = requireAdmin();
        AuthUser target = find(id);
        String previous = target.getBankUserId();
        if (previous == null) {
            return response(target);
        }
        target.clearBankUserLink();
        AuthUser saved = authUsers.save(target);
        audit(actor, saved.getId(), SecurityAuditAction.CUSTOMER_UNLINKED, previous, null);
        return response(saved);
    }

    public List<SecurityAuditResponse> getSecurityAudits() {
        requireAdmin();
        return securityAudits.findAll().stream().map(audit -> new SecurityAuditResponse(
                audit.getId(), audit.getActorUsername(), audit.getTargetAuthUserId(), audit.getAction(),
                audit.getPreviousValue(), audit.getNewValue(), audit.getCreatedAt())).toList();
    }

    private CurrentActor requireAdmin() {
        CurrentActor actor = authorization.currentActor();
        authorization.require(actor, BankPermission.AUTH_MANAGE);
        return actor;
    }

    private AuthUser find(String id) {
        return authUsers.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Authentication identity was not found"));
    }

    private void protectLastAdmin(AuthUser target, AuthRole nextRole, boolean nextEnabled) {
        boolean activeAdmin = target.isEnabled()
                && RolePermissions.effectiveRole(target.getPrimaryRole()) == AuthRole.ADMIN;
        boolean remainsActiveAdmin = nextEnabled && RolePermissions.effectiveRole(nextRole) == AuthRole.ADMIN;
        if (activeAdmin && !remainsActiveAdmin && authUsers.countEnabledByRole(AuthRole.ADMIN) <= 1) {
            throw new ResourceConflictException("At least one enabled administrator is required");
        }
    }

    private void audit(CurrentActor actor, String targetId, SecurityAuditAction action,
                       String previousValue, String newValue) {
        securityAudits.save(new SecurityAudit(
                actor.authUserId(), actor.username(), targetId, action,
                previousValue, newValue, LocalDateTime.now(clock)));
    }

    private AdminAuthUserResponse response(AuthUser user) {
        String bankUserName = user.getBankUserId() == null ? null
                : bankUsers.findById(user.getBankUserId()).map(User::getName).orElse("Unavailable");
        return new AdminAuthUserResponse(
                user.getId(), user.getUsername(), user.getEmail(),
                RolePermissions.effectiveRole(user.getPrimaryRole()).name(),
                user.getBankUserId(), bankUserName, user.isEnabled(), user.getCreatedAt());
    }
}
