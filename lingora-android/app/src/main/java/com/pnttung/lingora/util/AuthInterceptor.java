package com.pnttung.lingora.util;

import java.io.IOException;
import okhttp3.Interceptor;
import okhttp3.Request;
import okhttp3.Response;

public class AuthInterceptor implements Interceptor {

    private final SessionStore sessionStore;
    private final String supabaseAnonKey;

    public AuthInterceptor(SessionStore sessionStore, String supabaseAnonKey) {
        this.sessionStore = sessionStore;
        this.supabaseAnonKey = supabaseAnonKey;
    }

    @Override
    public Response intercept(Chain chain) throws IOException {
        Request original = chain.request();
        Request.Builder builder = original.newBuilder();

        if (supabaseAnonKey != null && !supabaseAnonKey.trim().isEmpty()) {
            if (original.header("apikey") == null) {
                builder.header("apikey", supabaseAnonKey);
            }
        }

        String accessToken = sessionStore != null ? sessionStore.getAccessToken() : null;
        if (accessToken != null && !accessToken.trim().isEmpty()) {
            if (original.header("Authorization") == null) {
                builder.header("Authorization", "Bearer " + accessToken);
            }
        }

        return chain.proceed(builder.build());
    }
}
