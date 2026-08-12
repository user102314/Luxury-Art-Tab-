package com.luxart.ecommerce.service;

import org.junit.jupiter.api.Test;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import javax.imageio.ImageIO;

import static org.junit.jupiter.api.Assertions.*;

class ImageConversionServiceTest {

    private final ImageConversionService service = new ImageConversionService(0.85f);

    @Test
    void convertPngToWebp() throws Exception {
        byte[] png = createPng(120, 80, Color.RED);

        ImageConversionService.ConvertedImage result = service.convertToWebp(png, "image/png");

        assertEquals(ImageConversionService.WEBP_CONTENT_TYPE, result.contentType());
        assertEquals(ImageConversionService.WEBP_EXTENSION, result.extension());
        assertTrue(result.data().length > 0);
        assertTrue(result.data().length < png.length || png.length < 200);
    }

    @Test
    void convertJpegToWebp() throws Exception {
        byte[] jpeg = createJpeg(100, 100, Color.BLUE);

        ImageConversionService.ConvertedImage result = service.convertToWebp(jpeg, "image/jpeg");

        assertEquals(ImageConversionService.WEBP_CONTENT_TYPE, result.contentType());
        assertTrue(result.data().length > 0);
    }

    @Test
    void rejectsInvalidImage() {
        assertThrows(Exception.class, () -> service.convertToWebp(new byte[]{1, 2, 3}, "image/png"));
    }

    private static byte[] createPng(int width, int height, Color color) throws Exception {
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();
        g.setColor(color);
        g.fillRect(0, 0, width, height);
        g.dispose();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(image, "png", out);
        return out.toByteArray();
    }

    private static byte[] createJpeg(int width, int height, Color color) throws Exception {
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();
        g.setColor(color);
        g.fillRect(0, 0, width, height);
        g.dispose();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(image, "jpg", out);
        return out.toByteArray();
    }
}
