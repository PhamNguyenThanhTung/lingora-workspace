package com.pnttung.lingora.data.remote.dto.srs;

import com.google.gson.annotations.SerializedName;

public class SrsPredictionItem {

    @SerializedName("vocabulary_id")
    private String vocabularyId;

    @SerializedName("recall_probability")
    private double recallProbability;

    @SerializedName("priority")
    private String priority;

    @SerializedName("recommended_interval_days")
    private double recommendedIntervalDays;

    public String getVocabularyId() {
        return vocabularyId;
    }

    public void setVocabularyId(String vocabularyId) {
        this.vocabularyId = vocabularyId;
    }

    public double getRecallProbability() {
        return recallProbability;
    }

    public void setRecallProbability(double recallProbability) {
        this.recallProbability = recallProbability;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public double getRecommendedIntervalDays() {
        return recommendedIntervalDays;
    }

    public void setRecommendedIntervalDays(double recommendedIntervalDays) {
        this.recommendedIntervalDays = recommendedIntervalDays;
    }
}
