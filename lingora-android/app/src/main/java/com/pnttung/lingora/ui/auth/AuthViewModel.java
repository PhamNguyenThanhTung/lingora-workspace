package com.pnttung.lingora.ui.auth;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;
import com.pnttung.lingora.data.repository.AuthRepository;
import com.pnttung.lingora.domain.model.AuthSession;

public class AuthViewModel extends ViewModel {

    public static class AuthState {
        public final boolean isLoading;
        public final boolean isSuccess;
        public final String errorMessage;
        public final AuthSession session;

        public AuthState(boolean isLoading, boolean isSuccess, String errorMessage, AuthSession session) {
            this.isLoading = isLoading;
            this.isSuccess = isSuccess;
            this.errorMessage = errorMessage;
            this.session = session;
        }

        public static AuthState loading() {
            return new AuthState(true, false, null, null);
        }

        public static AuthState success(AuthSession session) {
            return new AuthState(false, true, null, session);
        }

        public static AuthState error(String message) {
            return new AuthState(false, false, message, null);
        }

        public static AuthState idle() {
            return new AuthState(false, false, null, null);
        }
    }

    private final AuthRepository authRepository;
    private final MutableLiveData<AuthState> authState = new MutableLiveData<>(AuthState.idle());

    public AuthViewModel(AuthRepository authRepository) {
        this.authRepository = authRepository;
    }

    public LiveData<AuthState> getAuthState() {
        return authState;
    }

    public void login(String email, String password) {
        if (email == null || email.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            authState.setValue(AuthState.error("Vui lòng điền đầy đủ email và mật khẩu."));
            return;
        }

        authState.setValue(AuthState.loading());
        authRepository.login(email.trim(), password, new AuthRepository.AuthCallback() {
            @Override
            public void onSuccess(AuthSession session) {
                authState.postValue(AuthState.success(session));
            }

            @Override
            public void onError(String code, String message) {
                authState.postValue(AuthState.error(message));
            }
        });
    }

    public void register(String email, String password) {
        if (email == null || email.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            authState.setValue(AuthState.error("Vui lòng điền đầy đủ email và mật khẩu."));
            return;
        }
        if (password.length() < 6) {
            authState.setValue(AuthState.error("Mật khẩu phải có ít nhất 6 ký tự."));
            return;
        }

        authState.setValue(AuthState.loading());
        authRepository.signUp(email.trim(), password, new AuthRepository.AuthCallback() {
            @Override
            public void onSuccess(AuthSession session) {
                authState.postValue(AuthState.success(session));
            }

            @Override
            public void onError(String code, String message) {
                authState.postValue(AuthState.error(message));
            }
        });
    }

    public boolean checkExistingSession() {
        return authRepository.isLoggedIn();
    }
}
