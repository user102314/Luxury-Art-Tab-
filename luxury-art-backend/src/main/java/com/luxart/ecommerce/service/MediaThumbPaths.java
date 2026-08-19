package com.luxart.ecommerce.service;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public final class MediaThumbPaths {

    private MediaThumbPaths() {}

    public static String toStoragePath(String src) {
        if (src == null || src.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "src obligatoire");
        }
        String path = src.trim();
        int uploads = path.indexOf("/uploads/");
        if (uploads >= 0) {
            path = path.substring(uploads);
        }
        if (!path.startsWith("/uploads/") || path.contains("..")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chemin image invalide");
        }
        return path.substring("/uploads/".length());
    }
}
