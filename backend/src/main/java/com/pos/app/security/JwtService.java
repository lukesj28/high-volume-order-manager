package com.pos.app.security;

import com.pos.app.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    private final SecretKey key;
    private final long staffExpiryHours;
    private final long adminExpiryHours;

    public JwtService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.staff-expiry-hours:15}") long staffExpiryHours,
            @Value("${jwt.admin-expiry-hours:8}") long adminExpiryHours) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.staffExpiryHours = staffExpiryHours;
        this.adminExpiryHours = adminExpiryHours;
    }

    public String generateInitialToken(User user) {
        long expiryMs = (user.getRole() == User.Role.STAFF ? staffExpiryHours : adminExpiryHours) * 3600_000L;
        return Jwts.builder()
                .subject(user.getId().toString())
                .claim("role", user.getRole().name())
                .claim("username", user.getUsername())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiryMs))
                .signWith(key)
                .compact();
    }

    public String generateStationToken(User user, UUID stationProfileId) {
        long expiryMs = (user.getRole() == User.Role.STAFF ? staffExpiryHours : adminExpiryHours) * 3600_000L;
        return Jwts.builder()
                .subject(user.getId().toString())
                .claim("role", user.getRole().name())
                .claim("username", user.getUsername())
                .claim("stationProfileId", stationProfileId.toString())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiryMs))
                .signWith(key)
                .compact();
    }

    public Claims validateAndExtract(String token) {
        try {
            return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
        } catch (JwtException e) {
            throw new JwtException("Invalid or expired token", e);
        }
    }

    public UUID extractUserId(Claims claims) {
        return UUID.fromString(claims.getSubject());
    }

    public String extractRole(Claims claims) {
        return claims.get("role", String.class);
    }

    public UUID extractStationProfileId(Claims claims) {
        String id = claims.get("stationProfileId", String.class);
        return id != null ? UUID.fromString(id) : null;
    }
}
