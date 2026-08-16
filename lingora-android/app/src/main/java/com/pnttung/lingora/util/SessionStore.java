package com.pnttung.lingora.util;

import android.content.Context;
import android.content.SharedPreferences;
import androidx.security.crypto.EncryptedSharedPreferences;
import androidx.security.crypto.MasterKeys;
import com.pnttung.lingora.domain.model.AuthSession;

public class SessionStore {

    private static final String PREF_NAME = "lingora_secure_session";
    private static final String KEY_ACCESS_TOKEN = "access_token";
    private static final String KEY_REFRESH_TOKEN = "refresh_token";
    private static final String KEY_USER_ID = "user_id";
    private static final String KEY_EMAIL = "email";
    private static final String KEY_EXPIRES_AT = "expires_at";

    private final SharedPreferences prefs;

    public SessionStore(Context context) {
        SharedPreferences securePrefs;
        try {
            String masterKeyAlias = MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC);
            securePrefs = EncryptedSharedPreferences.create(
                    PREF_NAME,
                    masterKeyAlias,
                    context,
                    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            );
        } catch (Exception e) {
            // Fallback for JVM unit tests or legacy hardware environments
            securePrefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        }
        this.prefs = securePrefs;
    }

    public SessionStore(SharedPreferences preferences) {
        this.prefs = preferences;
    }

    public synchronized void saveSession(AuthSession session) {
        if (session == null) {
            clearSession();
            return;
        }
        prefs.edit()
                .putString(KEY_ACCESS_TOKEN, session.getAccessToken())
                .putString(KEY_REFRESH_TOKEN, session.getRefreshToken())
                .putString(KEY_USER_ID, session.getUserId())
                .putString(KEY_EMAIL, session.getEmail())
                .putLong(KEY_EXPIRES_AT, session.getExpiresAt())
                .apply();
    }

    public synchronized AuthSession getSession() {
        String accessToken = prefs.getString(KEY_ACCESS_TOKEN, null);
        if (accessToken == null || accessToken.trim().isEmpty()) {
            return null;
        }
        String refreshToken = prefs.getString(KEY_REFRESH_TOKEN, null);
        String userId = prefs.getString(KEY_USER_ID, null);
        String email = prefs.getString(KEY_EMAIL, null);
        long expiresAt = prefs.getLong(KEY_EXPIRES_AT, 0L);

        return new AuthSession(accessToken, refreshToken, userId, email, expiresAt);
    }

    public synchronized String getAccessToken() {
        return prefs.getString(KEY_ACCESS_TOKEN, null);
    }

    public synchronized String getRefreshToken() {
        return prefs.getString(KEY_REFRESH_TOKEN, null);
    }

    public synchronized boolean hasValidSession() {
        String token = getAccessToken();
        return token != null && !token.trim().isEmpty();
    }

    public synchronized void clearSession() {
        prefs.edit().clear().apply();
    }
}
