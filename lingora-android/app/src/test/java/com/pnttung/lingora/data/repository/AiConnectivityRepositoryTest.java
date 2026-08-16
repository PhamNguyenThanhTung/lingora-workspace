package com.pnttung.lingora.data.repository;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import android.content.SharedPreferences;
import com.pnttung.lingora.data.remote.AiService;
import com.pnttung.lingora.data.remote.dto.chat.ChatRoleplayRequest;
import com.pnttung.lingora.data.remote.dto.chat.ChatRoleplayResponse;
import com.pnttung.lingora.data.remote.dto.health.HealthResponse;
import com.pnttung.lingora.data.remote.dto.srs.SrsScheduleItem;
import com.pnttung.lingora.data.remote.dto.srs.SrsScheduleRequest;
import com.pnttung.lingora.data.remote.dto.srs.SrsScheduleResponse;
import com.pnttung.lingora.util.SessionStore;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import okhttp3.OkHttpClient;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mockito;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

public class AiConnectivityRepositoryTest {

    private MockWebServer server;
    private AiConnectivityRepository aiRepository;
    private SessionStore sessionStore;

    @Before
    public void setUp() throws IOException {
        server = new MockWebServer();
        server.start();

        SharedPreferences mockPrefs = Mockito.mock(SharedPreferences.class);
        sessionStore = new SessionStore(mockPrefs);

        AiService service = new Retrofit.Builder()
                .baseUrl(server.url("/"))
                .client(new OkHttpClient())
                .addConverterFactory(GsonConverterFactory.create())
                .build()
                .create(AiService.class);

        aiRepository = new AiConnectivityRepository(service, sessionStore);
    }

    @After
    public void tearDown() throws IOException {
        server.shutdown();
    }

    @Test
    public void testCheckHealthReady() throws InterruptedException {
        String json = "{\"status\": \"ok\", \"version\": \"1.0.0\", \"mock_mode\": true, \"srs_ready\": true, \"nlp_ready\": true}";
        server.enqueue(new MockResponse().setResponseCode(200).setBody(json));

        CountDownLatch latch = new CountDownLatch(1);
        AtomicReference<HealthResponse> resultRef = new AtomicReference<>();

        aiRepository.checkHealth(new AiConnectivityRepository.ApiCallback<HealthResponse>() {
            @Override
            public void onSuccess(HealthResponse result) {
                resultRef.set(result);
                latch.countDown();
            }

            @Override
            public void onError(String code, String message) {
                latch.countDown();
            }
        });

        assertTrue(latch.await(3, TimeUnit.SECONDS));
        assertNotNull(resultRef.get());
        assertEquals("ok", resultRef.get().getStatus());
        assertTrue(resultRef.get().getMockMode());
    }

    @Test
    public void testScheduleSrsMock() throws InterruptedException {
        String json = "{\n" +
                "  \"predictions\": [\n" +
                "    {\n" +
                "      \"vocabulary_id\": \"1069c152-a9f6-54e3-93d0-b488fc7e44e8\",\n" +
                "      \"recall_probability\": 0.35,\n" +
                "      \"priority\": \"REVIEW_NOW\",\n" +
                "      \"recommended_interval_days\": 1.0\n" +
                "    }\n" +
                "  ],\n" +
                "  \"model_version\": \"mock-srs-v1\",\n" +
                "  \"scheduler_version\": \"mock-rule-v1\",\n" +
                "  \"is_mock\": true,\n" +
                "  \"latency_ms\": 10\n" +
                "}";
        server.enqueue(new MockResponse().setResponseCode(200).setBody(json));

        CountDownLatch latch = new CountDownLatch(1);
        AtomicReference<SrsScheduleResponse> resultRef = new AtomicReference<>();

        List<SrsScheduleItem> items = new ArrayList<>();
        items.add(new SrsScheduleItem("1069c152-a9f6-54e3-93d0-b488fc7e44e8", 2.5, null));
        SrsScheduleRequest req = new SrsScheduleRequest("2026-08-15T12:00:00Z", items, "android/1.0.0");

        aiRepository.scheduleSrs(req, new AiConnectivityRepository.ApiCallback<SrsScheduleResponse>() {
            @Override
            public void onSuccess(SrsScheduleResponse result) {
                resultRef.set(result);
                latch.countDown();
            }

            @Override
            public void onError(String code, String message) {
                latch.countDown();
            }
        });

        assertTrue(latch.await(3, TimeUnit.SECONDS));
        assertNotNull(resultRef.get());
        assertEquals("mock-srs-v1", resultRef.get().getModelVersion());
        assertEquals(0.35, resultRef.get().getPredictions().get(0).getRecallProbability(), 0.001);
    }

    @Test
    public void testChatRoleplayMock() throws InterruptedException {
        String json = "{\n" +
                "  \"ai_reply\": \"Sure! Could you tell me the check-in date you'd like?\",\n" +
                "  \"model_version\": \"chat-t5small-v1.0.0\",\n" +
                "  \"is_mock\": true,\n" +
                "  \"latency_ms\": 15\n" +
                "}";
        server.enqueue(new MockResponse().setResponseCode(200).setBody(json));

        CountDownLatch latch = new CountDownLatch(1);
        AtomicReference<ChatRoleplayResponse> resultRef = new AtomicReference<>();

        ChatRoleplayRequest req = new ChatRoleplayRequest("hotel_booking", "en", null, "I want a room", "android/1.0.0");

        aiRepository.chatRoleplay(req, new AiConnectivityRepository.ApiCallback<ChatRoleplayResponse>() {
            @Override
            public void onSuccess(ChatRoleplayResponse result) {
                resultRef.set(result);
                latch.countDown();
            }

            @Override
            public void onError(String code, String message) {
                latch.countDown();
            }
        });

        assertTrue(latch.await(3, TimeUnit.SECONDS));
        assertNotNull(resultRef.get());
        assertEquals("Sure! Could you tell me the check-in date you'd like?", resultRef.get().getAiReply());
        assertTrue(resultRef.get().isMock());
    }
}
