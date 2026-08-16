package com.pnttung.lingora.data.remote.dto.common;

import com.google.gson.annotations.SerializedName;

public class ApiErrorEnvelope {

    @SerializedName("error")
    private ErrorDetail error;

    public ErrorDetail getError() {
        return error;
    }

    public void setError(ErrorDetail error) {
        this.error = error;
    }

    public static class ErrorDetail {
        @SerializedName("code")
        private String code;

        @SerializedName("message")
        private String message;

        @SerializedName("detail")
        private Object detail;

        public String getCode() {
            return code;
        }

        public void setCode(String code) {
            this.code = code;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }

        public Object getDetail() {
            return detail;
        }

        public void setDetail(Object detail) {
            this.detail = detail;
        }
    }
}
