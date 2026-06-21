package com.luxart.ecommerce.service;

import com.luxart.ecommerce.dto.LoginRequest;
import com.luxart.ecommerce.dto.LoginResponse;
import com.luxart.ecommerce.dto.ClientAuthResponse;
import com.luxart.ecommerce.dto.RegisterRequest;

public interface AuthService {
    LoginResponse login(LoginRequest request);
    ClientAuthResponse register(RegisterRequest request);
    ClientAuthResponse clientLogin(LoginRequest request);
}
