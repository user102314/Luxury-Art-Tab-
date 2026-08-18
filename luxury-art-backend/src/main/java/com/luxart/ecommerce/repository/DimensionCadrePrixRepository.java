package com.luxart.ecommerce.repository;

import com.luxart.ecommerce.model.entity.DimensionCadrePrix;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DimensionCadrePrixRepository extends JpaRepository<DimensionCadrePrix, Long> {
    List<DimensionCadrePrix> findAll();
    Optional<DimensionCadrePrix> findByDimensionIdAndCadreId(Long dimensionId, Long cadreId);
    List<DimensionCadrePrix> findByDimensionId(Long dimensionId);
    void deleteByDimensionId(Long dimensionId);
    void deleteByCadreId(Long cadreId);
}
