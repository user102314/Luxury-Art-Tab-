package com.luxart.ecommerce.service.impl;

import com.luxart.ecommerce.dto.ClientCrmDto;
import com.luxart.ecommerce.exception.ResourceNotFoundException;
import com.luxart.ecommerce.model.entity.Order;
import com.luxart.ecommerce.model.entity.User;
import com.luxart.ecommerce.model.enums.OrderCanal;
import com.luxart.ecommerce.model.enums.OrderStatut;
import com.luxart.ecommerce.model.enums.Role;
import com.luxart.ecommerce.repository.OrderRepository;
import com.luxart.ecommerce.repository.UserRepository;
import com.luxart.ecommerce.service.ClientCrmService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ClientCrmServiceImpl implements ClientCrmService {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    @Override
    public List<ClientCrmDto> findAllClients() {
        return userRepository.findByRoleOrderByCreatedAtDesc(Role.CLIENT).stream()
                .map(this::toCrm)
                .sorted(Comparator
                        .comparing(ClientCrmDto::getDerniereCommande, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(ClientCrmDto::getNombreCommandes, Comparator.reverseOrder()))
                .toList();
    }

    @Override
    public ClientCrmDto findByUserId(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Client introuvable: " + userId));
        if (user.getRole() != Role.CLIENT) {
            throw new ResourceNotFoundException("Utilisateur non client: " + userId);
        }
        return toCrm(user);
    }

    private ClientCrmDto toCrm(User user) {
        List<Order> orders = orderRepository.findByUserId(user.getId());
        long totalCmd = orders.stream().filter(o -> o.getStatut() != OrderStatut.ANNULEE).count();
        long livrees = orders.stream().filter(o -> o.getStatut() == OrderStatut.LIVREE).count();
        BigDecimal depense = orders.stream()
                .filter(o -> o.getStatut() == OrderStatut.LIVREE)
                .map(o -> o.getTotal() != null ? o.getTotal() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        LocalDateTime derniere = orders.stream()
                .map(Order::getDateCommande)
                .max(LocalDateTime::compareTo)
                .orElse(null);

        Set<String> canaux = new LinkedHashSet<>();
        String telephone = null;
        for (Order o : orders) {
            OrderCanal canal = o.getCanal() != null ? o.getCanal() : OrderCanal.SITE_WEB;
            canaux.add(canal.name());
            if (telephone == null && o.getClientTelephone() != null && !o.getClientTelephone().isBlank()) {
                telephone = o.getClientTelephone();
            }
        }

        String nom = orders.stream()
                .map(Order::getClientNom)
                .filter(n -> n != null && !n.isBlank())
                .findFirst()
                .orElse(user.getNom());

        return ClientCrmDto.builder()
                .userId(user.getId())
                .nom(nom)
                .email(user.getEmail())
                .telephone(telephone)
                .inscritLe(user.getCreatedAt())
                .nombreCommandes(totalCmd)
                .commandesLivrees(livrees)
                .totalDepense(depense)
                .derniereCommande(derniere)
                .canaux(new ArrayList<>(canaux))
                .build();
    }
}
