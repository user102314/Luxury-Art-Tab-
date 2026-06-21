package com.luxart.ecommerce.repository;

import com.luxart.ecommerce.model.entity.News;
import com.luxart.ecommerce.model.enums.NewsStatut;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NewsRepository extends JpaRepository<News, Long> {
    List<News> findByStatutOrderByPublishedAtDesc(NewsStatut statut);
    List<News> findByAuteurId(Long auteurId);
}
