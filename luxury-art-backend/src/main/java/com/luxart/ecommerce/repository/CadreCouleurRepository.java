package com.luxart.ecommerce.repository;

import com.luxart.ecommerce.model.entity.CadreCouleur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CadreCouleurRepository extends JpaRepository<CadreCouleur, Long> {
    List<CadreCouleur> findByCadreIdOrderByOrdreAscIdAsc(Long cadreId);
    boolean existsByCadreIdAndNomIgnoreCase(Long cadreId, String nom);
}
