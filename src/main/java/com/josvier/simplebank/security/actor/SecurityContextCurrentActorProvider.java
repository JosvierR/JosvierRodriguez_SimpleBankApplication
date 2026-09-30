package com.josvier.simplebank.security.actor;

import com.josvier.simplebank.auth.model.AuthUser;
import com.josvier.simplebank.auth.repository.AuthUserRepository;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Reads the current authentication and reloads that login from {@code auth_users}.
 */
@Component
public class SecurityContextCurrentActorProvider implements CurrentActorProvider {

    private final AuthUserRepository authUsers;

    public SecurityContextCurrentActorProvider(AuthUserRepository authUsers) {
        this.authUsers = authUsers;
    }

    @Override
    public CurrentActor current() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            throw new IllegalStateException("An authenticated API user is required");
        }
        String username = authentication.getName();
        AuthUser user = authUsers.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("Authenticated API user was not found"));
        return new CurrentActor(user.getId(), user.getUsername(), user.getPrimaryRole(), user.getBankUserId());
    }
}
