package com.luxart.ecommerce.controller;

import com.luxart.ecommerce.service.ImageConversionService;
import com.luxart.ecommerce.service.LocalFileStorageService;
import com.luxart.ecommerce.service.MediaThumbPaths;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.concurrent.TimeUnit;

/**
 * Miniatures WebP à la demande pour les images /uploads (LCP / cartes produit).
 */
@RestController
@RequestMapping("/api/media")
@RequiredArgsConstructor
public class MediaController {

    private final LocalFileStorageService localFileStorageService;
    private final ImageConversionService imageConversionService;

    @GetMapping("/thumb")
    public ResponseEntity<byte[]> thumb(
            @RequestParam String src,
            @RequestParam(defaultValue = "720") int w) {
        String storagePath = MediaThumbPaths.toStoragePath(src);
        int width = Math.min(1600, Math.max(80, w));
        Path original = localFileStorageService.resolveStoragePath(storagePath);
        if (!Files.isRegularFile(original)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Image introuvable");
        }

        Path cacheFile = cachePath(storagePath, width);
        try {
            if (!Files.isRegularFile(cacheFile) || Files.getLastModifiedTime(cacheFile)
                    .compareTo(Files.getLastModifiedTime(original)) < 0) {
                byte[] source = Files.readAllBytes(original);
                ImageConversionService.ConvertedImage converted =
                        imageConversionService.convertToWebp(source, null, width);
                Files.createDirectories(cacheFile.getParent());
                Path tmp = cacheFile.resolveSibling(cacheFile.getFileName() + ".tmp");
                Files.write(tmp, converted.data());
                try {
                    Files.move(tmp, cacheFile,
                            java.nio.file.StandardCopyOption.REPLACE_EXISTING,
                            java.nio.file.StandardCopyOption.ATOMIC_MOVE);
                } catch (java.nio.file.AtomicMoveNotSupportedException ex) {
                    Files.move(tmp, cacheFile, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                }
            }
            byte[] data = Files.readAllBytes(cacheFile);
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(ImageConversionService.WEBP_CONTENT_TYPE))
                    .cacheControl(CacheControl.maxAge(30, TimeUnit.DAYS).cachePublic())
                    .header(HttpHeaders.VARY, "Accept")
                    .body(data);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Erreur miniature");
        }
    }

    private Path cachePath(String storagePath, int width) {
        String hash = sha1(storagePath);
        return localFileStorageService.getLocalRoot()
                .resolve(".cache")
                .resolve("w" + width)
                .resolve(hash + ".webp");
    }

    private static String sha1(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-1").digest(value.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException ex) {
            return Integer.toHexString(value.hashCode());
        }
    }
}
