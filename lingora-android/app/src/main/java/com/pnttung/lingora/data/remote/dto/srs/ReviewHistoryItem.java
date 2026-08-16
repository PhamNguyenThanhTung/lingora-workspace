package com.pnttung.lingora.data.remote.dto.srs;

import com.google.gson.annotations.SerializedName;

public class ReviewHistoryItem {

    @SerializedName("is_correct")
    private boolean isCorrect;

    @SerializedName("interval_days")
    private double intervalDays;

    @SerializedName("reviewed_at")
    private String reviewedAt;

    public ReviewHistoryItem(boolean isCorrect, double intervalDays, String reviewedAt) {
        this.isCorrect = isCorrect;
        this.intervalDays = intervalDays;
        this.reviewedAt = reviewedAt;
    }

    public boolean isCorrect() {
        return isCorrect;
    }

    public void setCorrect(boolean correct) {
        isCorrect = correct;
    }

    public double getIntervalDays() {
        return intervalDays;
    }

    public void setIntervalDays(double intervalDays) {
        this.intervalDays = intervalDays;
    }

    public String getReviewedAt() {
        return reviewedAt;
    }

    public void setReviewedAt(String reviewedAt) {
        this.reviewedAt = reviewedAt;
    }
}
