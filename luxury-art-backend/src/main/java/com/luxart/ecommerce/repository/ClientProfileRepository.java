package com.luxart.ecommerce.repository;

import com.luxart.ecommerce.model.entity.ClientProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClientProfileRepository extends JpaRepository<ClientProfile, Long> {
    Optional<ClientProfile> findByUserId(Long userId);
    Optional<ClientProfile> findFirstByTelephone(String telephone);
    List<ClientProfile> findAllByOrderByTotalCommandesLivreesDesc();
    long countBy();
}
