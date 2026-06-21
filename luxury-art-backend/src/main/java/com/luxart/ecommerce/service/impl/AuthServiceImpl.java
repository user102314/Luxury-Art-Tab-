package com.luxart.ecommerce.service.impl;

import com.luxart.ecommerce.dto.*;
import com.luxart.ecommerce.model.entity.ClientProfile;
import com.luxart.ecommerce.model.entity.User;
import com.luxart.ecommerce.model.enums.Role;
import com.luxart.ecommerce.repository.ClientProfileRepository;
import com.luxart.ecommerce.repository.UserRepository;
import com.luxart.ecommerce.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final LoyaltyServiceImpl loyaltyService;

    @Override
    public LoginResponse login(LoginRequest request) {
        User user = authenticate(request);

        if (user.getRole() != Role.ADMIN && user.getRole() != Role.VENDEUR) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès réservé aux administrateurs et vendeurs");
        }

        return LoginResponse.builder()
                .id(user.getId())
                .nom(user.getNom())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    @Override
    @Transactional
    public ClientAuthResponse register(RegisterRequest request) {
        if (!Boolean.TRUE.equals(request.getAcceptTerms())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vous devez accepter les règles du site");
        }
        if (userRepository.findByEmail(request.getEmail().trim().toLowerCase()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cet email est déjà utilisé");
        }

        User user = userRepository.save(User.builder()
                .nom(request.getNom().trim())
                .email(request.getEmail().trim().toLowerCase())
                .motDePasse(request.getMotDePasse())
                .role(Role.CLIENT)
                .build());

        ClientProfile profile = clientProfileRepository.save(ClientProfile.builder()
                .user(user)
                .telephone(request.getTelephone())
                .termsAcceptedAt(LocalDateTime.now())
                .build());

        return toClientResponse(user, profile);
    }

    @Override
    public ClientAuthResponse clientLogin(LoginRequest request) {
        User user = authenticate(request);

        if (user.getRole() != Role.CLIENT || user.getEmail().endsWith("@guest.luxart.local")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Compte client invalide");
        }

        ClientProfile profile = clientProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profil client introuvable"));

        return toClientResponse(user, profile);
    }

    private User authenticate(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail().trim().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email ou mot de passe incorrect"));

        if (!user.getMotDePasse().equals(request.getMotDePasse())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email ou mot de passe incorrect");
        }
        return user;
    }

    private ClientAuthResponse toClientResponse(User user, ClientProfile profile) {
        ClientProfileDto dto = loyaltyService.toClientDto(profile);
        return ClientAuthResponse.builder()
                .id(user.getId())
                .nom(user.getNom())
                .email(user.getEmail())
                .role(user.getRole())
                .clientProfileId(profile.getId())
                .commandesCycle(dto.getCommandesCycle())
                .commandesRequises(dto.getCommandesRequises())
                .tableauxGratuits(dto.getTableauxGratuits())
                .reductionDisponible(dto.getReductionDisponible())
                .totalRecompenses(dto.getTotalRecompenses())
                .programmeNom(dto.getProgrammeNom())
                .typeRecompense(dto.getTypeRecompense())
                .build();
    }
}
