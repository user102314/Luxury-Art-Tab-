package com.luxart.ecommerce.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

/**
 * Stockage local des images produit sous {@code uploads/} (racine du backend),
 * exposé en HTTP via {@code /uploads/**} (voir WebConfig).
 */
@Service
@Slf4j
public class LocalFileStorageService {

    private final Path localRoot = Paths.get(System.getProperty("user.dir"), "uploads").toAbsolutePath().normalize();

    public String upload(String storagePath, byte[] content, String contentType) {
        try {
            Path target = resolveSafe(storagePath);
            Files.createDirectories(target.getParent());
            Files.write(target, content);
            log.info("Image enregistrée localement : {}", target);
            return getPublicUrl(storagePath);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Erreur enregistrement local: " + ex.getMessage());
        }
    }

    public void delete(String storagePath) {
        try {
            Files.deleteIfExists(resolveSafe(storagePath));
        } catch (IOException ex) {
            log.warn("Impossible de supprimer le fichier local : {}", storagePath);
        }
    }

    public String buildStoragePath(Long productId, String originalFilename) {
        String safeName = originalFilename != null
                ? originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_")
                : "image.jpg";
        return "products/" + productId + "/" + UUID.randomUUID() + "-" + safeName;
    }

    public String buildNewsStoragePath(Long newsId, String originalFilename) {
        String safeName = originalFilename != null
                ? originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_")
                : "image.jpg";
        return "news/" + newsId + "/" + UUID.randomUUID() + "-" + safeName;
    }

    public String getPublicUrl(String storagePath) {
        return "/uploads/" + storagePath.replace("\\", "/");
    }

    public Path getLocalRoot() {
        return localRoot;
    }

    private Path resolveSafe(String storagePath) {
        Path target = localRoot.resolve(storagePath).normalize();
        if (!target.startsWith(localRoot)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chemin de fichier invalide");
        }
        return target;
    }
}
