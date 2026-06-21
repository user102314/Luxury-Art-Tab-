package com.luxart.ecommerce.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VisitorResponse {

    private Long id;
    private String nom;
    private String email;
}
