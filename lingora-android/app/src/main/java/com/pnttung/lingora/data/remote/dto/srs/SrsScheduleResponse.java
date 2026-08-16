package com.pnttung.lingora.data.remote.dto.srs;

import com.google.gson.annotations.SerializedName;
import java.util.List;

public class SrsScheduleResponse {

    @SerializedName("predictions")
    private List<SrsPredictionItem> predictions;

    @SerializedName("model_version")
    private String modelVersion;

    @SerializedName("scheduler_version")
    private String schedulerVersion;

    @SerializedName("is_mock")
    private boolean isMock;

    @SerializedName("latency_ms")
    private Integer latencyMs;

    public List<SrsPredictionItem> getPredictions() {
        return predictions;
    }

    public void setPredictions(List<SrsPredictionItem> predictions) {
        this.predictions = predictions;
    }

    public String getModelVersion() {
        return modelVersion;
    }

    public void setModelVersion(String modelVersion) {
        this.modelVersion = modelVersion;
    }

    public String getSchedulerVersion() {
        return schedulerVersion;
    }

    public void setSchedulerVersion(String schedulerVersion) {
        this.schedulerVersion = schedulerVersion;
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
