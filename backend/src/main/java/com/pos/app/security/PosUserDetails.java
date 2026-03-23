package com.pos.app.security;

import com.pos.app.entity.StationProfile;
import com.pos.app.entity.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Getter
public class PosUserDetails implements UserDetails {

    private final UUID userId;
    private final String username;
    private final String role;
    private final UUID stationProfileId; // null if station not yet selected

    public PosUserDetails(UUID userId, String username, String role, UUID stationProfileId) {
        this.userId = userId;
        this.username = username;
        this.role = role;
        this.stationProfileId = stationProfileId;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role));
    }

    @Override public String getPassword() { return null; }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return true; }
}
