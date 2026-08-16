package com.pnttung.lingora.data.remote;

import com.pnttung.lingora.data.remote.dto.chat.ChatRoleplayRequest;
import com.pnttung.lingora.data.remote.dto.chat.ChatRoleplayResponse;
import com.pnttung.lingora.data.remote.dto.health.HealthResponse;
import com.pnttung.lingora.data.remote.dto.srs.SrsScheduleRequest;
import com.pnttung.lingora.data.remote.dto.srs.SrsScheduleResponse;
import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.POST;

public interface AiService {

    @GET("health/live")
    Call<HealthResponse> getHealthLive();

    @GET("health/ready")
    Call<HealthResponse> getHealthReady();

    @POST("v1/srs/schedule")
    Call<SrsScheduleResponse> scheduleSrs(@Body SrsScheduleRequest request);

    @POST("v1/chat/roleplay")
    Call<ChatRoleplayResponse> roleplayChat(@Body ChatRoleplayRequest request);
}
