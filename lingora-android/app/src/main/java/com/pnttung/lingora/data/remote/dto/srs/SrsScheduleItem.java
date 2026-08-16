package com.pnttung.lingora.data.remote.dto.srs;

import com.google.gson.annotations.SerializedName;
import java.util.List;

public class SrsScheduleItem {

    @SerializedName("vocabulary_id")
    private String vocabularyId;

    @SerializedName("ease_factor")
    private Double easeFactor;

    @SerializedName("history")
    private List<ReviewHistoryItem> history;

    public SrsScheduleItem(String vocabularyId, Double easeFactor, List<ReviewHistoryItem> history) {
        this.vocabularyId = vocabularyId;
        this.easeFactor = easeFactor;
        this.history = history;
    }

    public String getVocabularyId() {
        return vocabularyId;
    }

    public void setVocabularyId(String vocabularyId) {
        this.vocabularyId = vocabularyId;
    }

    public Double getEaseFactor() {
        return easeFactor;
    }

    public void setEaseFactor(Double easeFactor) {
        this.easeFactor = easeFactor;
    }

    public List<ReviewHistoryItem> getHistory() {
        return history;
    }

    public void setHistory(List<ReviewHistoryItem> history) {
        this.history = history;
    }
}
