package com.luxart.ecommerce.config;

import com.luxart.ecommerce.model.entity.Testimonial;
import com.luxart.ecommerce.model.enums.TestimonialPlateforme;
import com.luxart.ecommerce.repository.TestimonialRepository;
import com.luxart.ecommerce.service.LocalFileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

/**
 * Charge les captures d'avis clients fournies (classpath + dossier seed) si la table est vide.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class TestimonialSeedRunner implements ApplicationRunner {

    private final TestimonialRepository testimonialRepository;
    private final LocalFileStorageService localFileStorageService;

    @Override
    public void run(ApplicationArguments args) {
        if (testimonialRepository.count() > 0) {
            return;
        }

        List<SeedItem> seeds = List.of(
                new SeedItem(
                        "Hager Maamer",
                        "Commande reçue. Très beau tableau. Merci, aidek mabrouk ❤️",
                        "Votre satisfaction nous tient à cœur ❤️",
                        TestimonialPlateforme.MESSENGER,
                        "testimonial-1.png",
                        1),
                new SeedItem(
                        "Ibtihel Gares Khadhraoui",
                        "Honnêtement quand j'ai reçu ma commande, les tableaux a7la barcha metsawer 🥰 Merci beaucoup",
                        null,
                        TestimonialPlateforme.FACEBOOK,
                        "testimonial-2.png",
                        2),
                new SeedItem(
                        "Soulaima Lemjid",
                        "Merci beaucoup — Yeser mahlehom ❤️",
                        "Votre satisfaction nous tient à cœur ✨❤️",
                        TestimonialPlateforme.MESSENGER,
                        "testimonial-3.png",
                        3),
                new SeedItem(
                        "Cliente Luxury Art",
                        "Vos retours, vos messages, vos réactions… c'est ce qui nous motive chaque jour ❤️",
                        null,
                        TestimonialPlateforme.AUTRE,
                        "testimonial-4.png",
                        0)
        );

        for (SeedItem seed : seeds) {
            try {
                Testimonial saved = testimonialRepository.save(Testimonial.builder()
                        .clientNom(seed.clientNom())
                        .message(seed.message())
                        .reponseBoutique(seed.reponse())
                        .plateforme(seed.plateforme())
                        .actif(true)
                        .ordre(seed.ordre())
                        .build());

                byte[] bytes = readSeedImage(seed.filename());
                if (bytes != null) {
                    String path = localFileStorageService.buildTestimonialStoragePath(saved.getId(), seed.filename());
                    String url = localFileStorageService.upload(path, bytes, "image/png");
                    saved.setImageUrl(url);
                    testimonialRepository.save(saved);
                }
                log.info("Avis réel seedé : {}", seed.clientNom());
            } catch (Exception ex) {
                log.warn("Impossible de seeder l'avis {} : {}", seed.clientNom(), ex.getMessage());
            }
        }
    }

    private byte[] readSeedImage(String filename) {
        try {
            ClassPathResource resource = new ClassPathResource("seed/testimonials/" + filename);
            if (resource.exists()) {
                try (InputStream in = resource.getInputStream()) {
                    return in.readAllBytes();
                }
            }
        } catch (Exception ignored) {
            /* fall through */
        }
        try {
            Path disk = localFileStorageService.getLocalRoot().resolve("seed/testimonials").resolve(filename);
            if (Files.exists(disk)) {
                return Files.readAllBytes(disk);
            }
        } catch (Exception ignored) {
            /* ignore */
        }
        return null;
    }

    private record SeedItem(
            String clientNom,
            String message,
            String reponse,
            TestimonialPlateforme plateforme,
            String filename,
            int ordre) {}
}
