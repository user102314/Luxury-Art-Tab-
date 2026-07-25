package com.luxart.ecommerce.colissimo;

public class ColissimoApiException extends RuntimeException {

    public ColissimoApiException(String message) {
        super(message);
    }

    public ColissimoApiException(String message, Throwable cause) {
        super(message, cause);
    }
}
