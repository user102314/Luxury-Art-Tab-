package com.luxart.ecommerce.meta;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

/** Événement relayé par le navigateur (même event_id que le Pixel pour la déduplication). */
@Getter
@Setter
public class MetaEventRequest {

    @NotBlank
    private String eventName;

    @NotBlank
    private String eventId;

    private String eventSourceUrl;

    private String fbp;
    private String fbc;
    private String visitorKey;

    private String email;
    private String phone;
    private String firstName;
    private String lastName;

    private BigDecimal value;
    private String currency;
    private List<String> contentIds;
    private String contentName;
    private Integer numItems;
}
