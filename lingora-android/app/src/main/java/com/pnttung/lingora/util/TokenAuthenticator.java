package com.pnttung.lingora.util;

import com.google.gson.Gson;
import com.pnttung.lingora.data.remote.dto.auth.AuthResponse;
import com.pnttung.lingora.data.remote.dto.auth.RefreshTokenRequest;
import com.pnttung.lingora.domain.model.AuthSession;
import java.io.IOException;
import okhttp3.Authenticator;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import okhttp3.Route;

public class TokenAuthenticator implements Authenticator {

    private static final String HEADER_RETRY_COUNT = "X-Lingora-Retry-Count";
    private static final MediaType JSON_MEDIA_TYPE = MediaType.parse("application/json; charset=utf-8");

    private final SessionStore sessionStore;
    private final String supabaseUrl;
    private final String supabaseAnonKey;
    private final Gson gson;

    public TokenAuthenticator(SessionStore sessionStore, String supabaseUrl, String supabaseAnonKey) {
        this.sessionStore = sessionStore;
        this.supabaseUrl = supabaseUrl;
        this.supabaseAnonKey = supabaseAnonKey;
        this.gson = new Gson();
    }

    @Override
    public synchronized Request authenticate(Route route, Response response) throws IOException {
        // Prevent infinite retry loops: allow at most 1 retry per request
        String retryCount = response.request().header(HEADER_RETRY_COUNT);
        if (retryCount != null && Integer.parseInt(retryCount) >= 1) {
            sessionStore.clearSession();
            return null;
        }

        String refreshToken = sessionStore.getRefreshToken();
        if (refreshToken == null || refreshToken.trim().isEmpty()) {
            sessionStore.clearSession();
            return null;
        }

        // Execute synchronous refresh token exchange against Supabase GoTrue
        String refreshEndpoint = supabaseUrl + (supabaseUrl.endsWith("/") ? "" : "/") + "auth/v1/token?grant_type=refresh_token";
        RefreshTokenRequest refreshReq = new RefreshTokenRequest(refreshToken);
        String jsonBody = gson.toJson(refreshReq);

        OkHttpClient rawClient = new OkHttpClient.Builder().build();
        Request request = new Request.Builder()
                .url(refreshEndpoint)
                .addHeader("apikey", supabaseAnonKey)
                .addHeader("Content-Type", "application/json")
                .post(RequestBody.create(jsonBody, JSON_MEDIA_TYPE))
                .build();

        try (Response refreshResponse = rawClient.newCall(request).execute()) {
            if (refreshResponse.isSuccessful() && refreshResponse.body() != null) {
                String responseStr = refreshResponse.body().string();
                AuthResponse authResponse = gson.fromJson(responseStr, AuthResponse.class);

                if (authResponse != null && authResponse.getAccessToken() != null) {
                    long expiresAt = authResponse.getExpiresAt() != null ? authResponse.getExpiresAt() :
                            (System.currentTimeMillis() / 1000L + (authResponse.getExpiresIn() != null ? authResponse.getExpiresIn() : 3600L));
                    String userId = authResponse.getUser() != null ? authResponse.getUser().getId() : "";
                    String email = authResponse.getUser() != null ? authResponse.getUser().getEmail() : "";

                    AuthSession newSession = new AuthSession(
                            authResponse.getAccessToken(),
                            authResponse.getRefreshToken() != null ? authResponse.getRefreshToken() : refreshToken,
                            userId,
                            email,
                            expiresAt
                    );
                    sessionStore.saveSession(newSession);

                    // Retry the failed request with the new access token
                    return response.request().newBuilder()
                            .header("Authorization", "Bearer " + newSession.getAccessToken())
                            .header(HEADER_RETRY_COUNT, "1")
                            .build();
                }
            }
        } catch (Exception e) {
            // Refresh call failed
        }

        sessionStore.clearSession();
        return null;
    }
}
