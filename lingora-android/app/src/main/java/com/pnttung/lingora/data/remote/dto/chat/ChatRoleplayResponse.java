package com.pnttung.lingora.data.remote.dto.chat;

import com.google.gson.annotations.SerializedName;
import java.util.List;

public class ChatRoleplayResponse {

    @SerializedName("ai_reply")
    private String aiReply;

    @SerializedName("grammatical_acceptability_score")
    private Double grammaticalAcceptabilityScore;

    @SerializedName("feedback")
    private List<FeedbackItem> feedback;

    @SerializedName("model_version")
    private String modelVersion;

    @SerializedName("is_mock")
    private boolean isMock;

    @SerializedName("latency_ms")
    private Integer latencyMs;

    public String getAiReply() {
        return aiReply;
    }

    public void setAiReply(String aiReply) {
        this.aiReply = aiReply;
    }

    public Double getGrammaticalAcceptabilityScore() {
        return grammaticalAcceptabilityScore;
    }

    public void setGrammaticalAcceptabilityScore(Double grammaticalAcceptabilityScore) {
        this.grammaticalAcceptabilityScore = grammaticalAcceptabilityScore;
    }

    public List<FeedbackItem> getFeedback() {
        return feedback;
    }

    public void setFeedback(List<FeedbackItem> feedback) {
        this.feedback = feedback;
    }

    public String getModelVersion() {
        return modelVersion;
    }

    public void setModelVersion(String modelVersion) {
        this.modelVersion = modelVersion;
    }

    public boolean isMock() {
        return isMock;
    }

    public void setMock(boolean mock) {
        isMock = mock;
    }

    public Integer getLatencyMs() {
        return latencyMs;
    }

    public void setLatencyMs(Integer latencyMs) {
        this.latencyMs = latencyMs;
    }
}
