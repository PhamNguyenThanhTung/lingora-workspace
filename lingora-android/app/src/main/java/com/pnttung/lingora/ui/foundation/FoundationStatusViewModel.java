package com.pnttung.lingora.ui.foundation;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.pnttung.lingora.data.remote.dto.chat.ChatMessageHistory;
import com.pnttung.lingora.data.remote.dto.chat.ChatRoleplayRequest;
import com.pnttung.lingora.data.remote.dto.chat.ChatRoleplayResponse;
import com.pnttung.lingora.data.remote.dto.health.HealthResponse;
import com.pnttung.lingora.data.remote.dto.srs.ReviewHistoryItem;
import com.pnttung.lingora.data.remote.dto.srs.SrsScheduleItem;
import com.pnttung.lingora.data.remote.dto.srs.SrsScheduleRequest;
import com.pnttung.lingora.data.remote.dto.srs.SrsScheduleResponse;
import com.pnttung.lingora.data.repository.AiConnectivityRepository;
import com.pnttung.lingora.data.repository.AuthRepository;
import com.pnttung.lingora.domain.model.AuthSession;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class FoundationStatusViewModel extends ViewModel {

    public static class StatusUiState {
        public final boolean isLoading;
        public final String outputText;
        public final boolean isLoggedOut;

        public StatusUiState(boolean isLoading, String outputText, boolean isLoggedOut) {
            this.isLoading = isLoading;
            this.outputText = outputText;
            this.isLoggedOut = isLoggedOut;
        }

        public static StatusUiState loading() {
            return new StatusUiState(true, "Đang gửi yêu cầu...", false);
        }

        public static StatusUiState result(String text) {
            return new StatusUiState(false, text, false);
        }

        public static StatusUiState loggedOut() {
            return new StatusUiState(false, "Đã đăng xuất", true);
        }
    }

    private final AuthRepository authRepository;
    private final AiConnectivityRepository aiRepository;
    private final Gson prettyGson = new GsonBuilder().setPrettyPrinting().create();
    private final MutableLiveData<StatusUiState> uiState = new MutableLiveData<>(new StatusUiState(false, "Sẵn sàng", false));

    public FoundationStatusViewModel(AuthRepository authRepository, AiConnectivityRepository aiRepository) {
        this.authRepository = authRepository;
        this.aiRepository = aiRepository;
    }

    public LiveData<StatusUiState> getUiState() {
        return uiState;
    }

    public AuthSession getCurrentSession() {
        return authRepository.getCurrentSession();
    }

    public void testHealth() {
        uiState.setValue(StatusUiState.loading());
        aiRepository.checkHealth(new AiConnectivityRepository.ApiCallback<HealthResponse>() {
            @Override
            public void onSuccess(HealthResponse result) {
                String out = "[PASS] GET /health/ready\n" + prettyGson.toJson(result);
                uiState.postValue(StatusUiState.result(out));
            }

            @Override
            public void onError(String code, String message) {
                String out = "[FAIL] GET /health/ready\nCode: " + code + "\nMessage: " + message;
                uiState.postValue(StatusUiState.result(out));
            }
        });
    }

    public void testSrsInference() {
        uiState.setValue(StatusUiState.loading());

        List<ReviewHistoryItem> history = new ArrayList<>();
        history.add(new ReviewHistoryItem(true, 1.0, "2026-08-10T10:00:00Z"));

        List<SrsScheduleItem> items = new ArrayList<>();
        // Stable UUID from M1.4 seed
        items.add(new SrsScheduleItem("1069c152-a9f6-54e3-93d0-b488fc7e44e8", 2.5, history));

        SrsScheduleRequest request = new SrsScheduleRequest("2026-08-15T12:00:00Z", items, "android/1.0.0");

        aiRepository.scheduleSrs(request, new AiConnectivityRepository.ApiCallback<SrsScheduleResponse>() {
            @Override
            public void onSuccess(SrsScheduleResponse result) {
                String out = "[PASS] POST /v1/srs/schedule\n" + prettyGson.toJson(result);
                uiState.postValue(StatusUiState.result(out));
            }

            @Override
            public void onError(String code, String message) {
                String out = "[FAIL] POST /v1/srs/schedule\nCode: " + code + "\nMessage: " + message;
                uiState.postValue(StatusUiState.result(out));
            }
        });
    }

    public void testChatRoleplay() {
        uiState.setValue(StatusUiState.loading());

        List<ChatMessageHistory> history = new ArrayList<>();
        history.add(new ChatMessageHistory("ai", "Welcome to Sunrise Hotel! How can I help you today?"));

        ChatRoleplayRequest request = new ChatRoleplayRequest(
                "hotel_booking",
                "en",
                history,
                "I want to book a room for two nights.",
                "android/1.0.0"
        );

        aiRepository.chatRoleplay(request, new AiConnectivityRepository.ApiCallback<ChatRoleplayResponse>() {
            @Override
            public void onSuccess(ChatRoleplayResponse result) {
                String out = "[PASS] POST /v1/chat/roleplay\n" + prettyGson.toJson(result);
                uiState.postValue(StatusUiState.result(out));
            }

            @Override
            public void onError(String code, String message) {
                String out = "[FAIL] POST /v1/chat/roleplay\nCode: " + code + "\nMessage: " + message;
                uiState.postValue(StatusUiState.result(out));
            }
        });
    }

    public void logout() {
        uiState.setValue(StatusUiState.loading());
        authRepository.logout(() -> uiState.postValue(StatusUiState.loggedOut()));
    }
}
