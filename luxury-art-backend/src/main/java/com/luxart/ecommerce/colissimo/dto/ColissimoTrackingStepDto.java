package com.luxart.ecommerce.colissimo.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ColissimoTrackingStepDto {

    private String key;
    private String label;
    private String description;

    /** completed | current | pending */
    private String status;
}
