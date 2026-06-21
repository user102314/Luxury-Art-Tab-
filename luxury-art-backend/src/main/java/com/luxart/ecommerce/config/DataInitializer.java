package com.luxart.ecommerce.config;

import com.luxart.ecommerce.model.entity.Category;
import com.luxart.ecommerce.model.entity.LoyaltyProgram;
import com.luxart.ecommerce.model.entity.User;
import com.luxart.ecommerce.model.enums.LoyaltyRewardType;
import com.luxart.ecommerce.model.enums.Role;
import com.luxart.ecommerce.repository.CategoryRepository;
import com.luxart.ecommerce.repository.LoyaltyProgramRepository;
import com.luxart.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataInitializer {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final LoyaltyProgramRepository loyaltyProgramRepository;

    @Bean
    CommandLineRunner seedData() {
        return args -> {
            seedCategory("Cuisine", "Art et décoration pour la cuisine");
            seedCategory("Enfant", "Œuvres et objets pour chambre enfant");

            seedIfAbsent("admin@luxart.com", "Admin Luxury", "admin123", Role.ADMIN);
            seedIfAbsent("vendeur@luxart.com", "Vendeur Luxury", "vendeur123", Role.VENDEUR);
            seedDefaultLoyaltyProgram();
        };
    }

    private void seedDefaultLoyaltyProgram() {
        if (loyaltyProgramRepository.findFirstByActifTrue().isEmpty()
                && loyaltyProgramRepository.count() == 0) {
            loyaltyProgramRepository.save(LoyaltyProgram.builder()
                    .nom("3 commandes = 1 tableau gratuit")
                    .description("Offrez un tableau au choix après 3 commandes livrées")
                    .commandesRequises(3)
                    .typeRecompense(LoyaltyRewardType.FREE_TABLEAU)
                    .valeurRecompense(java.math.BigDecimal.ONE)
                    .actif(true)
                    .build());
            log.info("Programme fidélité par défaut créé");
        }
    }

    private void seedCategory(String nom, String description) {
        if (!categoryRepository.existsByNomIgnoreCase(nom)) {
            categoryRepository.save(Category.builder()
                    .nom(nom)
                    .description(description)
                    .build());
            log.info("Catégorie créée : {}", nom);
        }
    }

    private void seedIfAbsent(String email, String nom, String motDePasse, Role role) {
        if (userRepository.findByEmail(email).isEmpty()) {
            userRepository.save(User.builder()
                    .nom(nom)
                    .email(email)
                    .motDePasse(motDePasse)
                    .role(role)
                    .build());
            log.info("Utilisateur créé dans Supabase : {} ({})", email, role);
        }
    }
}
