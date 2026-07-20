package com.luxart.ecommerce.colissimo.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class ColissimoApiResponse {

    @JsonProperty("result_type")
    private String resultType;

    @JsonProperty("result_code")
    private String resultCode;

    @JsonProperty("result_content")
    private Object resultContent;
}
