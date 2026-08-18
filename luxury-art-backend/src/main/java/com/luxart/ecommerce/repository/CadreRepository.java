package com.luxart.ecommerce.repository;

import com.luxart.ecommerce.model.entity.Cadre;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CadreRepository extends JpaRepository<Cadre, Long> {
    Optional<Cadre> findByCodeIgnoreCase(String code);
    List<Cadre> findAllByOrderByOrdreAscIdAsc();
    boolean existsByNomIgnoreCase(String nom);
    boolean existsByCodeIgnoreCase(String code);
}
