package com.luxart.ecommerce.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Iterator;

/**
 * Convertit toute image raster (JPEG, PNG, GIF, BMP, WebP…) en WebP pour optimiser le chargement web.
 */
@Service
@Slf4j
public class ImageConversionService {

    public static final String WEBP_CONTENT_TYPE = "image/webp";
    public static final String WEBP_EXTENSION = ".webp";

    private final float webpQuality;

    public ImageConversionService(
            @Value("${app.images.webp.quality:0.85}") float webpQuality) {
        this.webpQuality = clampQuality(webpQuality);
    }

    public record ConvertedImage(byte[] data, String contentType, String extension) {}

    public ConvertedImage convertToWebp(byte[] input, String contentType) {
        return convertToWebp(input, contentType, 0);
    }

    public ConvertedImage convertToWebp(byte[] input, String contentType, int maxWidth) {
        if (input == null || input.length == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fichier image vide");
        }

        if (contentType != null && contentType.equalsIgnoreCase("image/svg+xml")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Le format SVG n'est pas supporté. Utilisez JPEG, PNG, GIF, BMP ou WebP.");
        }

        try (InputStream in = new ByteArrayInputStream(input)) {
            BufferedImage source = ImageIO.read(in);
            if (source == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Format d'image non reconnu ou fichier corrompu");
            }

            BufferedImage scaled = scaleDown(source, maxWidth);
            BufferedImage rgbImage = toCompatibleImage(scaled);
            byte[] webpBytes = writeWebp(rgbImage);

            log.debug("Image convertie en WebP : {} octets -> {} octets", input.length, webpBytes.length);
            return new ConvertedImage(webpBytes, WEBP_CONTENT_TYPE, WEBP_EXTENSION);
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Impossible de lire l'image : " + ex.getMessage());
        }
    }

    public BufferedImage scaleDown(BufferedImage source, int maxWidth) {
        if (source == null || maxWidth <= 0 || source.getWidth() <= maxWidth) {
            return source;
        }
        int width = maxWidth;
        int height = Math.max(1, (int) Math.round(source.getHeight() * (width / (double) source.getWidth())));
        BufferedImage scaled = new BufferedImage(
                width,
                height,
                source.getColorModel().hasAlpha() ? BufferedImage.TYPE_INT_ARGB : BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = scaled.createGraphics();
        try {
            graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            graphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            graphics.drawImage(source, 0, 0, width, height, null);
        } finally {
            graphics.dispose();
        }
        return scaled;
    }

    private BufferedImage toCompatibleImage(BufferedImage source) {
        if (source.getType() == BufferedImage.TYPE_INT_ARGB
                || source.getType() == BufferedImage.TYPE_4BYTE_ABGR) {
            return source;
        }

        boolean hasAlpha = source.getColorModel().hasAlpha();
        int imageType = hasAlpha ? BufferedImage.TYPE_INT_ARGB : BufferedImage.TYPE_INT_RGB;
        BufferedImage converted = new BufferedImage(source.getWidth(), source.getHeight(), imageType);

        Graphics2D graphics = converted.createGraphics();
        try {
            graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            if (!hasAlpha) {
                graphics.setColor(java.awt.Color.WHITE);
                graphics.fillRect(0, 0, converted.getWidth(), converted.getHeight());
            }
            graphics.drawImage(source, 0, 0, null);
        } finally {
            graphics.dispose();
        }
        return converted;
    }

    private byte[] writeWebp(BufferedImage image) throws IOException {
        Iterator<ImageWriter> writers = ImageIO.getImageWritersByMIMEType(WEBP_CONTENT_TYPE);
        if (!writers.hasNext()) {
            throw new IllegalStateException(
                    "Aucun encodeur WebP disponible. Vérifiez la dépendance webp-imageio.");
        }

        ImageWriter writer = writers.next();
        try (ByteArrayOutputStream out = new ByteArrayOutputStream();
             ImageOutputStream ios = ImageIO.createImageOutputStream(out)) {
            writer.setOutput(ios);

            ImageWriteParam param = writer.getDefaultWriteParam();
            if (param.canWriteCompressed()) {
                param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
                String[] types = param.getCompressionTypes();
                if (types != null && types.length > 0) {
                    param.setCompressionType(types[0]);
                }
                param.setCompressionQuality(webpQuality);
            }

            writer.write(null, new IIOImage(image, null, null), param);
            ios.flush();
            return out.toByteArray();
        } finally {
            writer.dispose();
        }
    }

    private static float clampQuality(float quality) {
        if (quality < 0.1f) {
            return 0.1f;
        }
        if (quality > 1.0f) {
            return 1.0f;
        }
        return quality;
    }
}
