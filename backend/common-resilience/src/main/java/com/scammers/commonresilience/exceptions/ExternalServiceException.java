package com.scammers.commonresilience.exceptions;

public class ExternalServiceException extends RuntimeException {
    private final int statusCode;
    private final String url;
    private final String clientName;

    public ExternalServiceException(String clientName, String url, int statusCode, String message) {
        super(message);
        this.clientName = clientName;
        this.statusCode = statusCode;
        this.url = url;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public String getUrl() {
        return url;
    }

    public String getClientName() {
        return clientName;
    }
}