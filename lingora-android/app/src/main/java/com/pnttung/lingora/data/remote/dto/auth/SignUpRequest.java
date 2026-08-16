package com.pnttung.lingora.data.remote.dto.auth;

import com.google.gson.annotations.SerializedName;

public class SignUpRequest {

    @SerializedName("email")
    private final String email;

    @SerializedName("password")
    private final String password;

    public SignUpRequest(String email, String password) {
        this.email = email;
        this.password = password;
    }

    public String getEmail() {
        return email;
    }

    public String getPassword() {
        return password;
    }
}
