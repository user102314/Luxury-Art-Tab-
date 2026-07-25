package com.luxart.ecommerce.colissimo.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class ColissimoAddParcelRequest {

    private String reference;
    private String client;
    private String adresse;
    private String ville;
    private String gouvernorat;
    private int nbPieces;
    private BigDecimal prix;
    private String tel1;
    private String tel2;
    private String designation;
    private String commentaire;
    private String type;
    private Integer echange;
}
