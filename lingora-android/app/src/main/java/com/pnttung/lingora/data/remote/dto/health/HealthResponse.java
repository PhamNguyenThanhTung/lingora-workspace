package com.pnttung.lingora.data.remote.dto.health;

import com.google.gson.annotations.SerializedName;

public class HealthResponse {

    @SerializedName("status")
    private String status;

    @SerializedName("version")
    private String version;

    @SerializedName("mock_mode")
    private Boolean mockMode;

    @SerializedName("srs_ready")
    private Boolean srsReady;

    @SerializedName("nlp_ready")
    private Boolean nlpReady;

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public Boolean getMockMode() {
        return mockMode;
    }

    public void setMockMode(Boolean mockMode) {
        this.mockMode = mockMode;
    }

    public Boolean getSrsReady() {
        return srsReady;
    }

    public void setSrsReady(Boolean srsReady) {
        this.srsReady = srsReady;
    }

    public Boolean getNlpReady() {
        return nlpReady;
    }

    public void setNlpReady(Boolean nlpReady) {
        this.nlpReady = nlpReady;
    }
}
