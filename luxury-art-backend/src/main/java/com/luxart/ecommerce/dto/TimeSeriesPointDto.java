package com.luxart.ecommerce.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimeSeriesPointDto {

    private LocalDate date;
    private BigDecimal value;
}
