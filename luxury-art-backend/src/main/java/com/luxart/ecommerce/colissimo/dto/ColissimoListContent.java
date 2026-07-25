package com.luxart.ecommerce.colissimo.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class ColissimoListContent {

    private List<ColissimoParcel> colis = new ArrayList<>();

    private String nbColis;

    private String nbPages;

    private String page;
}
