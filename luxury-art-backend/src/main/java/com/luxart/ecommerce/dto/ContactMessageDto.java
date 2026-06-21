package com.luxart.ecommerce.dto;

import com.luxart.ecommerce.model.enums.ContactMessageStatut;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContactMessageDto {

    private Long id;

    @NotBlank
    private String nom;

    @NotBlank
    @Email
    private String email;

    @NotBlank
    private String sujet;

    @NotBlank
    private String message;

    private ContactMessageStatut statut;
}
