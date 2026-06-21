package com.luxart.ecommerce.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupportFaqItem {
    private String question;
    private String answer;
}
