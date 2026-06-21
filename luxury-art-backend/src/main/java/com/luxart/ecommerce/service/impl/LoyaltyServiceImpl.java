package com.luxart.ecommerce.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.luxart.ecommerce.dto.*;
import com.luxart.ecommerce.exception.ResourceNotFoundException;
import com.luxart.ecommerce.model.entity.*;
import com.luxart.ecommerce.model.enums.LoyaltyRewardType;
import com.luxart.ecommerce.model.enums.OrderStatut;
import com.luxart.ecommerce.repository.*;
import com.luxart.ecommerce.service.LoyaltyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class LoyaltyServiceImpl implements LoyaltyService {

    private static final String GUEST_SUFFIX = "@guest.luxart.local";

    private final LoyaltyProgramRepository programRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final LoyaltyRewardRepository rewardRepository;
    private final OrderRepository orderRepository;

    @Override
    public LoyaltyProgramDto getActiveProgram() {
        return programRepository.findFirstByActifTrue()
                .map(this::toProgramDto)
                .orElse(null);
    }

    @Override
    public List<LoyaltyProgramDto> findAllPrograms() {
        return programRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toProgramDto)
                .toList();
    }

    @Override
    @Transactional
    public LoyaltyProgramDto createProgram(LoyaltyProgramDto dto) {
        LoyaltyProgram program = LoyaltyProgram.builder()
                .nom(dto.getNom())
                .description(dto.getDescription())
                .commandesRequises(dto.getCommandesRequises())
                .typeRecompense(dto.getTypeRecompense())
                .valeurRecompense(dto.getValeurRecompense())
                .actif(Boolean.TRUE.equals(dto.getActif()))
                .build();
        if (Boolean.TRUE.equals(dto.getActif())) {
            deactivateAll();
        }
        return toProgramDto(programRepository.save(program));
    }

    @Override
    @Transactional
    public LoyaltyProgramDto updateProgram(Long id, LoyaltyProgramDto dto) {
        LoyaltyProgram program = getProgramEntity(id);
        program.setNom(dto.getNom());
        program.setDescription(dto.getDescription());
        program.setCommandesRequises(dto.getCommandesRequises());
        program.setTypeRecompense(dto.getTypeRecompense());
        program.setValeurRecompense(dto.getValeurRecompense());
        if (Boolean.TRUE.equals(dto.getActif())) {
            deactivateAllExcept(id);
            program.setActif(true);
        }
        return toProgramDto(programRepository.save(program));
    }

    @Override
    @Transactional
    public LoyaltyProgramDto activateProgram(Long id) {
        deactivateAll();
        LoyaltyProgram program = getProgramEntity(id);
        program.setActif(true);
        return toProgramDto(programRepository.save(program));
    }

    @Override
    @Transactional
    public void deleteProgram(Long id) {
        programRepository.delete(getProgramEntity(id));
    }

    @Override
    public ClientProfileDto getProfileByUserId(Long userId) {
        return clientProfileRepository.findByUserId(userId)
                .map(this::toClientDto)
                .orElseThrow(() -> new ResourceNotFoundException("Profil client introuvable"));
    }

    @Override
    public List<ClientProfileDto> findAllClients() {
        return clientProfileRepository.findAllByOrderByTotalCommandesLivreesDesc().stream()
                .map(this::toClientDto)
                .toList();
    }

    @Override
    public LoyaltyStatsDto getStats() {
        List<ClientProfile> clients = clientProfileRepository.findAll();
        long totalRecompenses = clients.stream().mapToInt(ClientProfile::getTotalRecompenses).sum();
        long totalCommandes = clients.stream().mapToInt(ClientProfile::getTotalCommandesLivrees).sum();
        BigDecimal totalReductions = clients.stream()
                .map(ClientProfile::getReductionDisponible)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long tableaux = clients.stream().mapToInt(ClientProfile::getTableauxGratuits).sum();

        return LoyaltyStatsDto.builder()
                .totalClients(clients.size())
                .totalRecompenses(totalRecompenses)
                .totalCommandesLivreesClients(totalCommandes)
                .totalReductionsAccordees(totalReductions)
                .tableauxGratuitsAccordes(tableaux)
                .programmeActif(getActiveProgram())
                .build();
    }

    @Override
    public List<LoyaltyRewardDto> getRecentRewards() {
        return rewardRepository.findTop20ByOrderByEarnedAtDesc().stream()
                .map(this::toRewardDto)
                .toList();
    }

    @Override
    @Transactional
    public void onOrderDelivered(Order order) {
        if (order.getStatut() != OrderStatut.LIVREE || Boolean.TRUE.equals(order.getFideliteComptabilisee())) {
            return;
        }
        User user = order.getUser();
        if (user == null || user.getEmail() == null || user.getEmail().endsWith(GUEST_SUFFIX)) {
            order.setFideliteComptabilisee(true);
            orderRepository.save(order);
            return;
        }

        ClientProfile profile = clientProfileRepository.findByUserId(user.getId()).orElse(null);
        if (profile == null) {
            order.setFideliteComptabilisee(true);
            orderRepository.save(order);
            return;
        }

        profile.setTotalCommandesLivrees(profile.getTotalCommandesLivrees() + 1);
        profile.setCommandesCycle(profile.getCommandesCycle() + 1);

        LoyaltyProgram program = programRepository.findFirstByActifTrue().orElse(null);
        if (program != null) {
            while (profile.getCommandesCycle() >= program.getCommandesRequises()) {
                profile.setCommandesCycle(profile.getCommandesCycle() - program.getCommandesRequises());
                grantReward(profile, program, order);
            }
        }

        order.setFideliteComptabilisee(true);
        clientProfileRepository.save(profile);
        orderRepository.save(order);
    }

    private void grantReward(ClientProfile profile, LoyaltyProgram program, Order order) {
        profile.setTotalRecompenses(profile.getTotalRecompenses() + 1);

        String message;
        if (program.getTypeRecompense() == LoyaltyRewardType.FREE_TABLEAU) {
            int qty = program.getValeurRecompense().intValue();
            profile.setTableauxGratuits(profile.getTableauxGratuits() + Math.max(qty, 1));
            message = "Tableau gratuit offert après " + program.getCommandesRequises() + " commandes livrées";
        } else {
            profile.setReductionDisponible(
                    profile.getReductionDisponible().add(program.getValeurRecompense()));
            message = program.getValeurRecompense().stripTrailingZeros().toPlainString()
                    + " DH de réduction après " + program.getCommandesRequises() + " commandes livrées";
        }

        rewardRepository.save(LoyaltyReward.builder()
                .clientProfile(profile)
                .programmeNom(program.getNom())
                .typeRecompense(program.getTypeRecompense())
                .valeurRecompense(program.getValeurRecompense())
                .message(message)
                .build());

        log.info("Récompense fidélité accordée à userId={} : {}", profile.getUser().getId(), message);
    }

    private void deactivateAll() {
        programRepository.findAll().forEach(p -> {
            p.setActif(false);
            programRepository.save(p);
        });
    }

    private void deactivateAllExcept(Long id) {
        programRepository.findAll().stream()
                .filter(p -> !p.getId().equals(id))
                .forEach(p -> {
                    p.setActif(false);
                    programRepository.save(p);
                });
    }

    private LoyaltyProgram getProgramEntity(Long id) {
        return programRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Programme fidélité introuvable: " + id));
    }

    private LoyaltyProgramDto toProgramDto(LoyaltyProgram p) {
        return LoyaltyProgramDto.builder()
                .id(p.getId())
                .nom(p.getNom())
                .description(p.getDescription())
                .commandesRequises(p.getCommandesRequises())
                .typeRecompense(p.getTypeRecompense())
                .valeurRecompense(p.getValeurRecompense())
                .actif(p.getActif())
                .createdAt(p.getCreatedAt())
                .build();
    }

    public ClientProfileDto toClientDto(ClientProfile profile) {
        LoyaltyProgram active = programRepository.findFirstByActifTrue().orElse(null);
        User user = profile.getUser();
        return ClientProfileDto.builder()
                .id(profile.getId())
                .userId(user.getId())
                .nom(user.getNom())
                .email(user.getEmail())
                .telephone(profile.getTelephone())
                .commandesCycle(profile.getCommandesCycle())
                .totalCommandesLivrees(profile.getTotalCommandesLivrees())
                .totalRecompenses(profile.getTotalRecompenses())
                .tableauxGratuits(profile.getTableauxGratuits())
                .reductionDisponible(profile.getReductionDisponible())
                .commandesRequises(active != null ? active.getCommandesRequises() : null)
                .programmeNom(active != null ? active.getNom() : null)
                .typeRecompense(active != null ? active.getTypeRecompense().name() : null)
                .valeurRecompense(active != null ? active.getValeurRecompense() : null)
                .termsAcceptedAt(profile.getTermsAcceptedAt())
                .createdAt(profile.getCreatedAt())
                .build();
    }

    private LoyaltyRewardDto toRewardDto(LoyaltyReward r) {
        return LoyaltyRewardDto.builder()
                .id(r.getId())
                .clientProfileId(r.getClientProfile().getId())
                .clientNom(r.getClientProfile().getUser().getNom())
                .programmeNom(r.getProgrammeNom())
                .typeRecompense(r.getTypeRecompense().name())
                .valeurRecompense(r.getValeurRecompense())
                .message(r.getMessage())
                .earnedAt(r.getEarnedAt())
                .build();
    }
}
