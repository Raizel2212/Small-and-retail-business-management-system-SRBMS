package com.srbms.service.impl;

import com.srbms.dto.request.LoginRequest;
import com.srbms.dto.request.RegisterRequest;
import com.srbms.dto.response.AuthResponse;
import com.srbms.entity.User;
import com.srbms.exception.AppException;
import com.srbms.repository.UserRepository;
import com.srbms.security.JwtTokenProvider;
import com.srbms.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthServiceImpl(UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    @Override
    @Transactional
    public void register(RegisterRequest request) {
        // Kiểm tra xem tài khoản đã tồn tại chưa
        if (userRepository.existsByCccd(request.getCccd())) {
            throw new AppException(HttpStatus.CONFLICT, "Tài khoản đã tồn tại (Số CCCD này đã được đăng ký)");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(HttpStatus.CONFLICT, "Tài khoản đã tồn tại (Địa chỉ Email này đã được đăng ký)");
        }
        if (userRepository.existsBySdt(request.getSdt())) {
            throw new AppException(HttpStatus.CONFLICT, "Tài khoản đã tồn tại (Số điện thoại này đã được đăng ký)");
        }

        // Tự động gán username bằng cccd nếu người dùng không nhập riêng username
        String username = (request.getUsername() != null && !request.getUsername().isBlank())
                ? request.getUsername().trim()
                : request.getCccd();

        // Tạo User mới và băm mật khẩu bằng BCrypt
        User newUser = User.builder()
                .cccd(request.getCccd())
                .password(passwordEncoder.encode(request.getPassword()))
                .username(username)
                .fullName(request.getFullName())
                .sdt(request.getSdt())
                .email(request.getEmail())
                .dateOfBirth(request.getDateOfBirth())
                .role("ROLE_USER")
                .status("ACTIVE")
                .build();

        userRepository.save(newUser);
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String identifier = request.getCccd() != null ? request.getCccd().trim() : "";
        // 1. Kiểm tra tài khoản có tồn tại theo CCCD, Email hoặc Số điện thoại
        User user = userRepository.findByCccd(identifier)
                .or(() -> userRepository.findByEmail(identifier))
                .or(() -> userRepository.findBySdt(identifier))
                .orElseThrow(() -> new AppException(HttpStatus.UNAUTHORIZED, "Tài khoản chưa tồn tại hoặc sai số CCCD"));

        // 2. Kiểm tra mật khẩu
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "Sai mật khẩu");
        }

        // 3. Kiểm tra trạng thái tài khoản
        if ("LOCKED".equalsIgnoreCase(user.getStatus())) {
            throw new AppException(HttpStatus.FORBIDDEN, "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên");
        }

        // 4. Sinh JWT Token cho phiên đăng nhập
        String token = tokenProvider.generateToken(user.getCccd(), user.getRole());

        // 5. Trả về AuthResponse
        return AuthResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .expiresIn(tokenProvider.getExpirationDuration())
                .user(AuthResponse.UserSummary.builder()
                        .id(user.getId())
                        .cccd(user.getCccd())
                        .username(user.getUsername())
                        .fullName(user.getFullName())
                        .email(user.getEmail())
                        .sdt(user.getSdt())
                        .role(user.getRole())
                        .status(user.getStatus())
                        .isFirstLogin(user.getIsFirstLogin())
                        .businessGroup(user.getBusinessGroup())
                        .businessType(user.getBusinessType())
                        .otherBusinessType(user.getOtherBusinessType())
                        .businessName(user.getBusinessName())
                        .build())
                .build();
    }
}
