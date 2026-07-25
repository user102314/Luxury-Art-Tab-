package com.luxart.ecommerce.colissimo.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class ColissimoParcel {

    private String code;

    private String reference;

    private String client;

    private String adresse;

    private String ville;

    private String gouvernorat;

    private String tel1;

    @JsonProperty("nb_pieces")
    private Integer nbPieces;

    private BigDecimal prix;

    private String designation;

    private String commentaire;

    private String type;

    private Integer echange;

    @JsonProperty("date_creation")
    private String dateCreation;

    @JsonProperty("agence_actuelle")
    private String agenceActuelle;

    private String etat;

    @JsonProperty("num_manifeste")
    private String numManifeste;

    @JsonProperty("num_paiement")
    private String numPaiement;
}
