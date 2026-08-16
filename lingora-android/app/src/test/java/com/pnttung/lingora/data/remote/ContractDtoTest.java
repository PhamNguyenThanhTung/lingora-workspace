package com.pnttung.lingora.data.remote;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.google.gson.Gson;
import com.pnttung.lingora.data.remote.dto.chat.ChatMessageHistory;
import com.pnttung.lingora.data.remote.dto.chat.ChatRoleplayRequest;
import com.pnttung.lingora.data.remote.dto.chat.ChatRoleplayResponse;
import com.pnttung.lingora.data.remote.dto.common.ApiErrorEnvelope;
import com.pnttung.lingora.data.remote.dto.health.HealthResponse;
import com.pnttung.lingora.data.remote.dto.srs.ReviewHistoryItem;
import com.pnttung.lingora.data.remote.dto.srs.SrsScheduleItem;
import com.pnttung.lingora.data.remote.dto.srs.SrsScheduleRequest;
import com.pnttung.lingora.data.remote.dto.srs.SrsScheduleResponse;
import java.util.ArrayList;
import java.util.List;
import org.junit.Before;
import org.junit.Test;

public class ContractDtoTest {

    private Gson gson;

    @Before
    public void setUp() {
        gson = new Gson();
    }

    @Test
    public void testSrsScheduleRequestSerialization() {
        List<ReviewHistoryItem> history = new ArrayList<>();
        history.add(new ReviewHistoryItem(true, 1.0, "2026-08-10T10:00:00Z"));

        List<SrsScheduleItem> items = new ArrayList<>();
        items.add(new SrsScheduleItem("1069c152-a9f6-54e3-93d0-b488fc7e44e8", 2.5, history));

        SrsScheduleRequest req = new SrsScheduleRequest("2026-08-15T12:00:00Z", items, "android/1.0.0");
        String json = gson.toJson(req);

        assertTrue(json.contains("\"vocabulary_id\":\"1069c152-a9f6-54e3-93d0-b488fc7e44e8\""));
        assertTrue(json.contains("\"is_correct\":true"));
        assertTrue(json.contains("\"client\":\"android/1.0.0\""));
    }

    @Test
    public void testSrsScheduleResponseDeserialization() {
        String json = "{\n" +
                "  \"predictions\": [\n" +
                "    {\n" +
                "      \"vocabulary_id\": \"1069c152-a9f6-54e3-93d0-b488fc7e44e8\",\n" +
                "      \"recall_probability\": 0.42,\n" +
                "      \"priority\": \"REVIEW_NOW\",\n" +
                "      \"recommended_interval_days\": 1.5\n" +
                "    }\n" +
                "  ],\n" +
                "  \"model_version\": \"mock-srs-v1\",\n" +
                "  \"scheduler_version\": \"mock-rule-v1\",\n" +
                "  \"is_mock\": true,\n" +
                "  \"latency_ms\": 10\n" +
                "}";

        SrsScheduleResponse res = gson.fromJson(json, SrsScheduleResponse.class);
        assertNotNull(res);
        assertEquals("mock-srs-v1", res.getModelVersion());
        assertEquals("mock-rule-v1", res.getSchedulerVersion());
        assertTrue(res.isMock());
        assertEquals(1, res.getPredictions().size());
        assertEquals("1069c152-a9f6-54e3-93d0-b488fc7e44e8", res.getPredictions().get(0).getVocabularyId());
        assertEquals(0.42, res.getPredictions().get(0).getRecallProbability(), 0.001);
        assertEquals("REVIEW_NOW", res.getPredictions().get(0).getPriority());
    }

    @Test
    public void testChatRoleplaySerializationAndDeserialization() {
        List<ChatMessageHistory> history = new ArrayList<>();
        history.add(new ChatMessageHistory("ai", "Hello"));

        ChatRoleplayRequest req = new ChatRoleplayRequest("hotel_booking", "en", history, "I want a room", "android/1.0.0");
        String reqJson = gson.toJson(req);
        assertTrue(reqJson.contains("\"scenario_code\":\"hotel_booking\""));

        String resJson = "{\n" +
                "  \"ai_reply\": \"Sure! Could you tell me the check-in date you'd like?\",\n" +
                "  \"model_version\": \"chat-t5small-v1.0.0\",\n" +
                "  \"is_mock\": true,\n" +
                "  \"latency_ms\": 15\n" +
                "}";

        ChatRoleplayResponse res = gson.fromJson(resJson, ChatRoleplayResponse.class);
        assertNotNull(res);
        assertEquals("Sure! Could you tell me the check-in date you'd like?", res.getAiReply());
        assertEquals("chat-t5small-v1.0.0", res.getModelVersion());
        assertTrue(res.isMock());
    }

    @Test
    public void testErrorEnvelopeDeserialization() {
        String json = "{\n" +
                "  \"error\": {\n" +
                "    \"code\": \"TEXT_TOO_LONG\",\n" +
                "    \"message\": \"User message exceeds maximum length of 500 characters.\",\n" +
                "    \"detail\": {\"max_chars\": 500}\n" +
                "  }\n" +
                "}";

        ApiErrorEnvelope envelope = gson.fromJson(json, ApiErrorEnvelope.class);
        assertNotNull(envelope);
        assertNotNull(envelope.getError());
        assertEquals("TEXT_TOO_LONG", envelope.getError().getCode());
        assertTrue(envelope.getError().getMessage().contains("500 characters"));
    }

    @Test
    public void testHealthResponseDeserialization() {
        String json = "{\"status\": \"ok\", \"version\": \"1.0.0\", \"mock_mode\": true, \"srs_ready\": true, \"nlp_ready\": true}";
        HealthResponse res = gson.fromJson(json, HealthResponse.class);
        assertNotNull(res);
        assertEquals("ok", res.getStatus());
        assertTrue(res.getMockMode());
        assertTrue(res.getSrsReady());
        assertTrue(res.getNlpReady());
    }
}
