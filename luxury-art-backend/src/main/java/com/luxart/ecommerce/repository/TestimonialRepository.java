package com.luxart.ecommerce.repository;

import com.luxart.ecommerce.model.entity.Testimonial;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TestimonialRepository extends JpaRepository<Testimonial, Long> {
    List<Testimonial> findByActifTrueOrderByOrdreAscCreatedAtDesc();
    List<Testimonial> findAllByOrderByOrdreAscCreatedAtDesc();
}
