package com.pnttung.lingora.data.remote.dto.srs;

import com.google.gson.annotations.SerializedName;
import java.util.List;

public class SrsScheduleRequest {

    @SerializedName("now")
    private String now;

    @SerializedName("items")
    private List<SrsScheduleItem> items;

    @SerializedName("client")
    private String client;

    public SrsScheduleRequest(String now, List<SrsScheduleItem> items, String client) {
        this.now = now;
        this.items = items;
        this.client = client;
    }

    public String getNow() {
        return now;
    }

    public void setNow(String now) {
        this.now = now;
    }

    public List<SrsScheduleItem> getItems() {
        return items;
    }

    public void setItems(List<SrsScheduleItem> items) {
        this.items = items;
    }

    public String getClient() {
        return client;
    }

    public void setClient(String client) {
        this.client = client;
    }
}
