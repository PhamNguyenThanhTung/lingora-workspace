package com.pnttung.lingora.data.remote;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.pnttung.lingora.util.AuthInterceptor;
import com.pnttung.lingora.util.SessionStore;
import com.pnttung.lingora.util.TokenAuthenticator;
import java.util.concurrent.TimeUnit;
import okhttp3.OkHttpClient;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

public class RetrofitProvider {

    private final SupabaseAuthService supabaseAuthService;
    private final AiService aiService;

    public RetrofitProvider(String supabaseUrl, String supabaseAnonKey, String aiApiBaseUrl, SessionStore sessionStore) {
        String normalizedSupabaseUrl = supabaseUrl.endsWith("/") ? supabaseUrl : supabaseUrl + "/";
        String normalizedAiUrl = aiApiBaseUrl.endsWith("/") ? aiApiBaseUrl : aiApiBaseUrl + "/";

        Gson gson = new GsonBuilder().create();

        HttpLoggingInterceptor loggingInterceptor = new HttpLoggingInterceptor();
        loggingInterceptor.setLevel(HttpLoggingInterceptor.Level.BODY);

        // 1. Supabase Auth Client
        OkHttpClient supabaseHttpClient = new OkHttpClient.Builder()
                .connectTimeout(15, TimeUnit.SECONDS)
                .readTimeout(15, TimeUnit.SECONDS)
                .addInterceptor(new AuthInterceptor(sessionStore, supabaseAnonKey))
                .authenticator(new TokenAuthenticator(sessionStore, normalizedSupabaseUrl, supabaseAnonKey))
                .addInterceptor(loggingInterceptor)
                .build();

        Retrofit supabaseRetrofit = new Retrofit.Builder()
                .baseUrl(normalizedSupabaseUrl)
                .client(supabaseHttpClient)
                .addConverterFactory(GsonConverterFactory.create(gson))
                .build();

        this.supabaseAuthService = supabaseRetrofit.create(SupabaseAuthService.class);

        // 2. Stateless FastAPI AI Service Client
        OkHttpClient aiHttpClient = new OkHttpClient.Builder()
                .connectTimeout(15, TimeUnit.SECONDS)
                .readTimeout(15, TimeUnit.SECONDS)
                .addInterceptor(new AuthInterceptor(sessionStore, null))
                .authenticator(new TokenAuthenticator(sessionStore, normalizedSupabaseUrl, supabaseAnonKey))
                .addInterceptor(loggingInterceptor)
                .build();

        Retrofit aiRetrofit = new Retrofit.Builder()
                .baseUrl(normalizedAiUrl)
                .client(aiHttpClient)
                .addConverterFactory(GsonConverterFactory.create(gson))
                .build();

        this.aiService = aiRetrofit.create(AiService.class);
    }

    public SupabaseAuthService getSupabaseAuthService() {
        return supabaseAuthService;
    }

    public AiService getAiService() {
        return aiService;
    }
}
