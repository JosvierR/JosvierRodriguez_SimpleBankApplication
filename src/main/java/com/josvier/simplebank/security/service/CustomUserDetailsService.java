package com.josvier.simplebank.security.service;

import com.josvier.simplebank.auth.model.AuthUser;
import com.josvier.simplebank.auth.repository.AuthUserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Loads an API login and exposes its roles as {@code ROLE_USER} or {@code ROLE_ADMIN}.
 *
 * The domain enum stays {@code USER}. The prefix is added only here so
 * the rest of the security layer does not mix the two spellings.
 */
@Service
public class CustomUserDetailsService implements UserDetailsService {

    static final String ROLE_PREFIX = "ROLE_";

    private final AuthUserRepository authUsers;

    public CustomUserDetailsService(AuthUserRepository authUsers) {
        this.authUsers = authUsers;
    }

    @Override
    public UserDetails loadUserByUsername(String username) {
        AuthUser user = authUsers.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return toUserDetails(user);
    }

    public UserDetails toUserDetails(AuthUser user) {
        List<SimpleGrantedAuthority> authorities = user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority(ROLE_PREFIX + role.name()))
                .toList();
        return User.withUsername(user.getUsername())
                .password(user.getPasswordHash())
                .authorities(authorities)
                .disabled(!user.isEnabled())
                .build();
    }

    public static String roleName(String authority) {
        if (authority != null && authority.startsWith(ROLE_PREFIX)) {
            return authority.substring(ROLE_PREFIX.length());
        }
        return authority;
    }

    public static List<String> roleNames(UserDetails userDetails) {
        return userDetails.getAuthorities().stream()
                .map(authority -> roleName(authority.getAuthority()))
                .sorted()
                .toList();
    }
}
