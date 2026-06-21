package com.luxart.ecommerce.dto;

import com.luxart.ecommerce.model.enums.Role;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {

    private Long id;
    private String nom;
    private String email;
    private Role role;
}
