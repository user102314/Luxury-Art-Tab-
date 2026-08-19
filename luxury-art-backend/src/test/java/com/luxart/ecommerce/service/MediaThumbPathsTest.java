package com.luxart.ecommerce.service;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class MediaThumbPathsTest {

    @Test
    void extractsRelativeStoragePath() {
        assertEquals("news/6/photo.png", MediaThumbPaths.toStoragePath("/uploads/news/6/photo.png"));
        assertEquals(
                "products/1/a.webp",
                MediaThumbPaths.toStoragePath("https://api.luxury-art.tn/uploads/products/1/a.webp"));
    }

    @Test
    void rejectsTraversal() {
        assertThrows(ResponseStatusException.class, () -> MediaThumbPaths.toStoragePath("/uploads/../secret.png"));
        assertThrows(ResponseStatusException.class, () -> MediaThumbPaths.toStoragePath("/etc/passwd"));
    }
}
