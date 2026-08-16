package com.pnttung.lingora.data.remote.dto.chat;

import com.google.gson.annotations.SerializedName;

public class FeedbackItem {

    @SerializedName("span")
    private String span;

    @SerializedName("suggestion")
    private String suggestion;

    @SerializedName("note")
    private String note;

    public String getSpan() {
        return span;
    }

    public void setSpan(String span) {
        this.span = span;
    }

    public String getSuggestion() {
        return suggestion;
    }

    public void setSuggestion(String suggestion) {
        this.suggestion = suggestion;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
