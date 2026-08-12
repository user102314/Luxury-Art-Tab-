package com.luxart.ecommerce.service;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
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

    private final Path localRoot;

    public LocalFileStorageService(
            @Value("${app.uploads.dir:}") String uploadsDir) {
        if (uploadsDir != null && !uploadsDir.isBlank()) {
            this.localRoot = Paths.get(uploadsDir).toAbsolutePath().normalize();
        } else {
            Path cwd = Paths.get("").toAbsolutePath().normalize();
            Path fromMonorepo = cwd.resolve("luxury-art-backend").resolve("uploads");
            if (Files.isDirectory(fromMonorepo) || "Luxury-Art-Tab-".equals(cwd.getFileName().toString())) {
                this.localRoot = fromMonorepo.toAbsolutePath().normalize();
            } else {
                this.localRoot = cwd.resolve("uploads").toAbsolutePath().normalize();
            }
        }
    }

    @PostConstruct
    void ensureRoot() {
        try {
            Files.createDirectories(localRoot);
            log.info("Dossier uploads : {}", localRoot);
        } catch (IOException ex) {
            throw new IllegalStateException("Impossible de créer le dossier uploads: " + localRoot, ex);
        }
    }

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

    public boolean exists(String storagePath) {
        return Files.exists(resolveSafe(storagePath));
    }

    public byte[] read(String storagePath) {
        try {
            return Files.readAllBytes(resolveSafe(storagePath));
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Fichier introuvable: " + storagePath);
        }
    }

    public String toWebpStoragePath(String storagePath) {
        if (storagePath == null || storagePath.isBlank()) {
            return "image.webp";
        }
        String normalized = storagePath.replace("\\", "/");
        if (normalized.toLowerCase().endsWith(".webp")) {
            return normalized;
        }
        int dot = normalized.lastIndexOf('.');
        if (dot > normalized.lastIndexOf('/')) {
            return normalized.substring(0, dot) + ".webp";
        }
        return normalized + ".webp";
    }

    public String buildStoragePath(Long productId, String originalFilename) {
        String baseName = stripExtension(originalFilename);
        return "products/" + productId + "/" + UUID.randomUUID() + "-" + baseName + ".webp";
    }

    private String stripExtension(String filename) {
        String safeName = filename != null && !filename.isBlank()
                ? filename.replaceAll("[^a-zA-Z0-9._-]", "_")
                : "image";
        int dot = safeName.lastIndexOf('.');
        if (dot > 0) {
            safeName = safeName.substring(0, dot);
        }
        return safeName.isBlank() ? "image" : safeName;
    }

    public String buildNewsStoragePath(Long newsId, String originalFilename) {
        String safeName = originalFilename != null
                ? originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_")
                : "image.jpg";
        return "news/" + newsId + "/" + UUID.randomUUID() + "-" + safeName;
    }

    public String buildTestimonialStoragePath(Long testimonialId, String originalFilename) {
        String safeName = originalFilename != null
                ? originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_")
                : "image.jpg";
        return "testimonials/" + testimonialId + "/" + UUID.randomUUID() + "-" + safeName;
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
