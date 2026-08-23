package com.luxart.ecommerce.audit;

public record AdminActor(String email, String name, String ip, String requestPath, String httpMethod) {
}
