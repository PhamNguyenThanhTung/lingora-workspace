package com.pnttung.lingora.data.repository;

import com.google.gson.Gson;
import com.pnttung.lingora.data.remote.AiService;
import com.pnttung.lingora.data.remote.dto.chat.ChatRoleplayRequest;
import com.pnttung.lingora.data.remote.dto.chat.ChatRoleplayResponse;
import com.pnttung.lingora.data.remote.dto.common.ApiErrorEnvelope;
import com.pnttung.lingora.data.remote.dto.health.HealthResponse;
import com.pnttung.lingora.data.remote.dto.srs.SrsScheduleRequest;
import com.pnttung.lingora.data.remote.dto.srs.SrsScheduleResponse;
import com.pnttung.lingora.util.SessionStore;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class AiConnectivityRepository {

    public interface ApiCallback<T> {
        void onSuccess(T result);
        void onError(String code, String message);
    }

    private final AiService aiService;
    private final SessionStore sessionStore;
    private final Gson gson;

    public AiConnectivityRepository(AiService aiService, SessionStore sessionStore) {
        this.aiService = aiService;
        this.sessionStore = sessionStore;
        this.gson = new Gson();
    }

    public void checkHealth(ApiCallback<HealthResponse> callback) {
        aiService.getHealthReady().enqueue(new Callback<HealthResponse>() {
            @Override
            public void onResponse(Call<HealthResponse> call, Response<HealthResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    if (callback != null) callback.onSuccess(response.body());
                } else {
                    String errorMsg = parseErrorMessage(response);
                    if (callback != null) callback.onError("HEALTH_ERROR", errorMsg);
                }
            }

            @Override
            public void onFailure(Call<HealthResponse> call, Throwable t) {
                if (callback != null) callback.onError("NETWORK_ERROR", t.getMessage());
            }
        });
    }

    public void scheduleSrs(SrsScheduleRequest request, ApiCallback<SrsScheduleResponse> callback) {
        aiService.scheduleSrs(request).enqueue(new Callback<SrsScheduleResponse>() {
            @Override
            public void onResponse(Call<SrsScheduleResponse> call, Response<SrsScheduleResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    if (callback != null) callback.onSuccess(response.body());
                } else {
                    String errorMsg = parseErrorMessage(response);
                    if (callback != null) callback.onError("SRS_ERROR", errorMsg);
                }
            }

            @Override
            public void onFailure(Call<SrsScheduleResponse> call, Throwable t) {
                if (callback != null) callback.onError("NETWORK_ERROR", t.getMessage());
            }
        });
    }

    public void chatRoleplay(ChatRoleplayRequest request, ApiCallback<ChatRoleplayResponse> callback) {
        aiService.roleplayChat(request).enqueue(new Callback<ChatRoleplayResponse>() {
            @Override
            public void onResponse(Call<ChatRoleplayResponse> call, Response<ChatRoleplayResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    if (callback != null) callback.onSuccess(response.body());
                } else {
                    String errorMsg = parseErrorMessage(response);
                    if (callback != null) callback.onError("CHAT_ERROR", errorMsg);
                }
            }

            @Override
            public void onFailure(Call<ChatRoleplayResponse> call, Throwable t) {
                if (callback != null) callback.onError("NETWORK_ERROR", t.getMessage());
            }
        });
    }

    private String parseErrorMessage(Response<?> response) {
        try {
            if (response.errorBody() != null) {
                String errorJson = response.errorBody().string();
                ApiErrorEnvelope envelope = gson.fromJson(errorJson, ApiErrorEnvelope.class);
                if (envelope != null && envelope.getError() != null && envelope.getError().getMessage() != null) {
                    return envelope.getError().getMessage() + " [" + envelope.getError().getCode() + "]";
                }
                return errorJson;
            }
        } catch (Exception ignored) {}
        return "HTTP " + response.code() + ": " + response.message();
    }
}
