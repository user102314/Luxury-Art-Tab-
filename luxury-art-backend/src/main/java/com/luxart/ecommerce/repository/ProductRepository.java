package com.luxart.ecommerce.repository;

import com.luxart.ecommerce.model.entity.Product;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    @EntityGraph(attributePaths = "dimensions")
    List<Product> findAll();

    @EntityGraph(attributePaths = "dimensions")
    Optional<Product> findById(Long id);

    List<Product> findByCategorieId(Long categoryId);
}
