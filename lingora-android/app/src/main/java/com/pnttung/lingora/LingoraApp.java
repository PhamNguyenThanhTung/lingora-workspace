package com.pnttung.lingora;

import android.app.Application;
import com.pnttung.lingora.data.remote.RetrofitProvider;
import com.pnttung.lingora.data.repository.AiConnectivityRepository;
import com.pnttung.lingora.data.repository.AuthRepository;
import com.pnttung.lingora.util.SessionStore;

public class LingoraApp extends Application {

    private SessionStore sessionStore;
    private RetrofitProvider retrofitProvider;
    private AuthRepository authRepository;
    private AiConnectivityRepository aiConnectivityRepository;

    @Override
    public void onCreate() {
        super.onCreate();
        sessionStore = new SessionStore(this);
        retrofitProvider = new RetrofitProvider(
                BuildConfig.SUPABASE_URL,
                BuildConfig.SUPABASE_ANON_KEY,
                BuildConfig.AI_API_BASE_URL,
                sessionStore
        );
        authRepository = new AuthRepository(
                retrofitProvider.getSupabaseAuthService(),
                sessionStore
        );
        aiConnectivityRepository = new AiConnectivityRepository(
                retrofitProvider.getAiService(),
                sessionStore
        );
    }

    public SessionStore getSessionStore() {
        return sessionStore;
    }

    public AuthRepository getAuthRepository() {
        return authRepository;
    }

    public AiConnectivityRepository getAiConnectivityRepository() {
        return aiConnectivityRepository;
    }
}
