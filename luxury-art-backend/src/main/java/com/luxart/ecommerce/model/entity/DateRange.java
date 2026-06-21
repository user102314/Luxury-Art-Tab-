package com.luxart.ecommerce.model.entity;

import jakarta.persistence.Embeddable;
import lombok.*;

import java.time.LocalDate;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DateRange {

    private LocalDate dateDebut;
    private LocalDate dateFin;
}
