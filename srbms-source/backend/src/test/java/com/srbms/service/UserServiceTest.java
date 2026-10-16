package com.srbms.service;

import com.srbms.dto.UserDto;
import com.srbms.dto.request.BusinessProfileRequest;
import com.srbms.entity.User;
import com.srbms.exception.AppException;
import com.srbms.repository.UserRepository;
import com.srbms.service.impl.UserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserServiceImpl userService;

    private User mockUser;
    private BusinessProfileRequest profileRequest;

    @BeforeEach
    void setUp() {
        mockUser = User.builder()
                .id(1L)
                .cccd("079201001234")
                .fullName("Nguyen Van A")
                .email("vana@example.com")
                .sdt("0901234567")
                .isFirstLogin(true)
                .build();

        profileRequest = BusinessProfileRequest.builder()
                .businessGroup(2)
                .businessType("Thương mại")
                .businessName("Cửa hàng Minh Phát")
                .build();
    }

    @Test
    @DisplayName("Cập nhật thông tin hộ kinh doanh thành công và đổi isFirstLogin thành false")
    void testUpdateBusinessProfile_Success() {
        when(userRepository.findByCccd("079201001234")).thenReturn(Optional.of(mockUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserDto result = userService.updateBusinessProfile("079201001234", profileRequest);

        assertNotNull(result);
        assertEquals(2, result.getBusinessGroup());
        assertEquals("Thương mại", result.getBusinessType());
        assertEquals("Cửa hàng Minh Phát", result.getBusinessName());
        assertFalse(result.getIsFirstLogin());
        verify(userRepository, times(1)).save(mockUser);
    }

    @Test
    @DisplayName("Cập nhật thất bại khi không tìm thấy tài khoản")
    void testUpdateBusinessProfile_NotFound() {
        when(userRepository.findByCccd("999999999999")).thenReturn(Optional.empty());

        assertThrows(AppException.class, () -> userService.updateBusinessProfile("999999999999", profileRequest));
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Lấy thông tin người dùng hiện tại theo CCCD thành công")
    void testGetCurrentUser_Success() {
        when(userRepository.findByCccd("079201001234")).thenReturn(Optional.of(mockUser));

        UserDto result = userService.getCurrentUser("079201001234");

        assertNotNull(result);
        assertEquals("079201001234", result.getCccd());
        assertEquals("Nguyen Van A", result.getFullName());
    }
}
