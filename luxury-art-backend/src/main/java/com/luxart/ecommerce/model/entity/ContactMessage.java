package com.luxart.ecommerce.model.entity;

import com.luxart.ecommerce.model.enums.ContactMessageStatut;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "contact_messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContactMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String sujet;

    @Column(nullable = false, length = 5000)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ContactMessageStatut statut;

    @PrePersist
    protected void onCreate() {
        if (statut == null) {
            statut = ContactMessageStatut.NON_LU;
        }
    }

    public void markRead() {
        this.statut = ContactMessageStatut.LU;
    }
}
