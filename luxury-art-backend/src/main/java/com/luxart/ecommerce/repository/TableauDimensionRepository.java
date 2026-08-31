package com.luxart.ecommerce.repository;

import com.luxart.ecommerce.model.entity.TableauDimension;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TableauDimensionRepository extends JpaRepository<TableauDimension, Long> {
    Optional<TableauDimension> findByLabelIgnoreCaseAndNote(String label, String note);
    List<TableauDimension> findAllByOrderByOrdreAscIdAsc();
    boolean existsByLabelIgnoreCaseAndNote(String label, String note);
}
