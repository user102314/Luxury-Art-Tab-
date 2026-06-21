package com.luxart.ecommerce.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VisitorRegisterRequest {

    @NotBlank
    private String visitorKey;

    private String nom;
}
