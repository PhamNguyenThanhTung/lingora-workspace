package com.pnttung.lingora.domain.model;

import java.util.Objects;

public class AuthSession {
    private final String accessToken;
    private final String refreshToken;
    private final String userId;
    private final String email;
    private final long expiresAt;

    public AuthSession(String accessToken, String refreshToken, String userId, String email, long expiresAt) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.userId = userId;
        this.email = email;
        this.expiresAt = expiresAt;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public String getUserId() {
        return userId;
    }

    public String getEmail() {
        return email;
    }

    public long getExpiresAt() {
        return expiresAt;
    }

    public boolean isValid() {
        return accessToken != null && !accessToken.trim().isEmpty();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        AuthSession that = (AuthSession) o;
        return expiresAt == that.expiresAt &&
                Objects.equals(accessToken, that.accessToken) &&
                Objects.equals(refreshToken, that.refreshToken) &&
                Objects.equals(userId, that.userId) &&
                Objects.equals(email, that.email);
    }

    @Override
    public int hashCode() {
        return Objects.hash(accessToken, refreshToken, userId, email, expiresAt);
    }
}
