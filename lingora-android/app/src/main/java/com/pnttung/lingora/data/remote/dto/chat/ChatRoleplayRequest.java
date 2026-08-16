package com.pnttung.lingora.data.remote.dto.chat;

import com.google.gson.annotations.SerializedName;
import java.util.List;

public class ChatRoleplayRequest {

    @SerializedName("scenario_code")
    private String scenarioCode;

    @SerializedName("lang")
    private String lang;

    @SerializedName("history")
    private List<ChatMessageHistory> history;

    @SerializedName("user_message")
    private String userMessage;

    @SerializedName("client")
    private String client;

    public ChatRoleplayRequest(String scenarioCode, String lang, List<ChatMessageHistory> history, String userMessage, String client) {
        this.scenarioCode = scenarioCode;
        this.lang = lang;
        this.history = history;
        this.userMessage = userMessage;
        this.client = client;
    }

    public String getScenarioCode() {
        return scenarioCode;
    }

    public void setScenarioCode(String scenarioCode) {
        this.scenarioCode = scenarioCode;
    }

    public String getLang() {
        return lang;
    }

    public void setLang(String lang) {
        this.lang = lang;
    }

    public List<ChatMessageHistory> getHistory() {
        return history;
    }

    public void setHistory(List<ChatMessageHistory> history) {
        this.history = history;
    }

    public String getUserMessage() {
        return userMessage;
    }

    public void setUserMessage(String userMessage) {
        this.userMessage = userMessage;
    }

    public String getClient() {
        return client;
    }

    public void setClient(String client) {
        this.client = client;
    }
}
