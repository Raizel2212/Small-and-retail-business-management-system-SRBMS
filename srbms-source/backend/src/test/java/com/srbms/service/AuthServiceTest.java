package com.srbms.service;

import com.srbms.dto.request.LoginRequest;
import com.srbms.dto.request.RegisterRequest;
import com.srbms.dto.response.AuthResponse;
import com.srbms.entity.User;
import com.srbms.exception.AppException;
import com.srbms.repository.UserRepository;
import com.srbms.security.JwtTokenProvider;
import com.srbms.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider tokenProvider;

    @InjectMocks
    private AuthServiceImpl authService;

    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;
    private User mockUser;

    @BeforeEach
    void setUp() {
        registerRequest = RegisterRequest.builder()
                .cccd("079201001234")
                .password("Password123")
                .fullName("Nguyen Van A")
                .email("vana@example.com")
                .sdt("0901234567")
                .dateOfBirth(LocalDate.of(1995, 5, 20))
                .build();

        loginRequest = LoginRequest.builder()
                .cccd("079201001234")
                .password("Password123")
                .build();

        mockUser = User.builder()
                .id(1L)
                .cccd("079201001234")
                .password("$2a$10$hashedPasswordHere")
                .fullName("Nguyen Van A")
                .email("vana@example.com")
                .sdt("0901234567")
                .role("ROLE_USER")
                .status("ACTIVE")
                .build();
    }

    @Test
    @DisplayName("Đăng ký thành công khi dữ liệu hợp lệ và chưa tồn tại")
    void testRegister_Success() {
        when(userRepository.existsByCccd(any())).thenReturn(false);
        when(userRepository.existsByEmail(any())).thenReturn(false);
        when(userRepository.existsBySdt(any())).thenReturn(false);
        when(passwordEncoder.encode("Password123")).thenReturn("encodedPassword");

        assertDoesNotThrow(() -> authService.register(registerRequest));
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("Đăng ký thất bại khi CCCD đã tồn tại")
    void testRegister_Fail_DuplicateCccd() {
        when(userRepository.existsByCccd("079201001234")).thenReturn(true);

        AppException exception = assertThrows(AppException.class, () -> authService.register(registerRequest));
        assertTrue(exception.getMessage().contains("Tài khoản đã tồn tại"));
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Đăng nhập thành công trả về JWT token")
    void testLogin_Success() {
        when(userRepository.findByCccd("079201001234")).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches("Password123", mockUser.getPassword())).thenReturn(true);
        when(tokenProvider.generateToken("079201001234", "ROLE_USER")).thenReturn("mock.jwt.token");
        when(tokenProvider.getExpirationDuration()).thenReturn(86400000L);

        AuthResponse response = authService.login(loginRequest);

        assertNotNull(response);
        assertEquals("mock.jwt.token", response.getAccessToken());
        assertEquals("Bearer", response.getTokenType());
        assertEquals("Nguyen Van A", response.getUser().getFullName());
    }

    @Test
    @DisplayName("Đăng nhập thất bại khi sai CCCD hoặc tài khoản chưa tồn tại")
    void testLogin_Fail_AccountNotFound() {
        when(userRepository.findByCccd("079201001234")).thenReturn(Optional.empty());

        AppException exception = assertThrows(AppException.class, () -> authService.login(loginRequest));
        assertTrue(exception.getMessage().contains("Tài khoản chưa tồn tại hoặc sai số CCCD"));
    }

    @Test
    @DisplayName("Đăng nhập thất bại khi sai mật khẩu")
    void testLogin_Fail_WrongPassword() {
        when(userRepository.findByCccd("079201001234")).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches("Password123", mockUser.getPassword())).thenReturn(false);

        AppException exception = assertThrows(AppException.class, () -> authService.login(loginRequest));
        assertEquals("Sai mật khẩu", exception.getMessage());
    }
}
