package com.pnttung.lingora.data.repository;

import com.google.gson.Gson;
import com.pnttung.lingora.data.remote.SupabaseAuthService;
import com.pnttung.lingora.data.remote.dto.auth.AuthResponse;
import com.pnttung.lingora.data.remote.dto.auth.LoginRequest;
import com.pnttung.lingora.data.remote.dto.auth.SignUpRequest;
import com.pnttung.lingora.data.remote.dto.common.ApiErrorEnvelope;
import com.pnttung.lingora.domain.model.AuthSession;
import com.pnttung.lingora.util.SessionStore;
import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class AuthRepository {

    public interface AuthCallback {
        void onSuccess(AuthSession session);
        void onError(String code, String message);
    }

    public interface LogoutCallback {
        void onComplete();
    }

    private final SupabaseAuthService authService;
    private final SessionStore sessionStore;
    private final Gson gson;

    public AuthRepository(SupabaseAuthService authService, SessionStore sessionStore) {
        this.authService = authService;
        this.sessionStore = sessionStore;
        this.gson = new Gson();
    }

    public void login(String email, String password, AuthCallback callback) {
        LoginRequest request = new LoginRequest(email, password);
        authService.loginPassword(request).enqueue(new Callback<AuthResponse>() {
            @Override
            public void onResponse(Call<AuthResponse> call, Response<AuthResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    AuthSession session = mapToSession(response.body());
                    sessionStore.saveSession(session);
                    if (callback != null) callback.onSuccess(session);
                } else {
                    String errorMsg = parseErrorMessage(response);
                    if (callback != null) callback.onError("AUTH_ERROR", errorMsg);
                }
            }

            @Override
            public void onFailure(Call<AuthResponse> call, Throwable t) {
                if (callback != null) callback.onError("NETWORK_ERROR", t.getMessage());
            }
        });
    }

    public void signUp(String email, String password, AuthCallback callback) {
        SignUpRequest request = new SignUpRequest(email, password);
        authService.signUp(request).enqueue(new Callback<AuthResponse>() {
            @Override
            public void onResponse(Call<AuthResponse> call, Response<AuthResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    AuthSession session = mapToSession(response.body());
                    if (session.isValid()) {
                        sessionStore.saveSession(session);
                    }
                    if (callback != null) callback.onSuccess(session);
                } else {
                    String errorMsg = parseErrorMessage(response);
                    if (callback != null) callback.onError("SIGNUP_ERROR", errorMsg);
                }
            }

            @Override
            public void onFailure(Call<AuthResponse> call, Throwable t) {
                if (callback != null) callback.onError("NETWORK_ERROR", t.getMessage());
            }
        });
    }

    public void logout(LogoutCallback callback) {
        authService.logout().enqueue(new Callback<ResponseBody>() {
            @Override
            public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                sessionStore.clearSession();
                if (callback != null) callback.onComplete();
            }

            @Override
            public void onFailure(Call<ResponseBody> call, Throwable t) {
                sessionStore.clearSession();
                if (callback != null) callback.onComplete();
            }
        });
    }

    public AuthSession getCurrentSession() {
        return sessionStore.getSession();
    }

    public boolean isLoggedIn() {
        return sessionStore.hasValidSession();
    }

    private AuthSession mapToSession(AuthResponse res) {
        long expiresAt = res.getExpiresAt() != null ? res.getExpiresAt() :
                (System.currentTimeMillis() / 1000L + (res.getExpiresIn() != null ? res.getExpiresIn() : 3600L));
        String userId = res.getUser() != null ? res.getUser().getId() : "";
        String email = res.getUser() != null ? res.getUser().getEmail() : "";

        return new AuthSession(
                res.getAccessToken() != null ? res.getAccessToken() : "",
                res.getRefreshToken() != null ? res.getRefreshToken() : "",
                userId,
                email,
                expiresAt
        );
    }

    private String parseErrorMessage(Response<?> response) {
        try {
            if (response.errorBody() != null) {
                String errorJson = response.errorBody().string();
                ApiErrorEnvelope envelope = gson.fromJson(errorJson, ApiErrorEnvelope.class);
                if (envelope != null && envelope.getError() != null && envelope.getError().getMessage() != null) {
                    return envelope.getError().getMessage();
                }
                return errorJson;
            }
        } catch (Exception ignored) {}
        return "HTTP " + response.code() + ": " + response.message();
    }
}
