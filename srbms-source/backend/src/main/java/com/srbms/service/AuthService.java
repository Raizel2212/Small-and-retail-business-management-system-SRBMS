package com.srbms.service;

import com.srbms.dto.request.LoginRequest;
import com.srbms.dto.request.RegisterRequest;
import com.srbms.dto.response.AuthResponse;

public interface AuthService {

    void register(RegisterRequest request);

    AuthResponse login(LoginRequest request);
}
