package com.pnttung.lingora.data.remote;

import com.pnttung.lingora.data.remote.dto.auth.AuthResponse;
import com.pnttung.lingora.data.remote.dto.auth.LoginRequest;
import com.pnttung.lingora.data.remote.dto.auth.RefreshTokenRequest;
import com.pnttung.lingora.data.remote.dto.auth.SignUpRequest;
import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.POST;

public interface SupabaseAuthService {

    @POST("auth/v1/signup")
    Call<AuthResponse> signUp(@Body SignUpRequest request);

    @POST("auth/v1/token?grant_type=password")
    Call<AuthResponse> loginPassword(@Body LoginRequest request);

    @POST("auth/v1/token?grant_type=refresh_token")
    Call<AuthResponse> refreshToken(@Body RefreshTokenRequest request);

    @POST("auth/v1/logout")
    Call<ResponseBody> logout();
}
