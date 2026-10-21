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

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private com.srbms.repository.HouseholdBusinessRepository householdBusinessRepository;

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
    @DisplayName("Cập nhật thông tin hộ kinh doanh thành công (Nhóm 2) và đổi isFirstLogin thành false")
    void testUpdateBusinessProfile_Success() {
        when(userRepository.findByCccd("079201001234")).thenReturn(Optional.of(mockUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserDto result = userService.updateBusinessProfile("079201001234", profileRequest);

        assertNotNull(result);
        assertEquals(2, result.getBusinessGroup());
        assertEquals("Từ 1 đến 3 tỷ", result.getBusinessRevenueRange());
        assertEquals("Thương mại", result.getBusinessType());
        assertEquals("Cửa hàng Minh Phát", result.getBusinessName());
        assertFalse(result.getIsFirstLogin());
        verify(userRepository, times(1)).save(mockUser);
    }

    @Test
    @DisplayName("Cập nhật thông tin hộ kinh doanh Nhóm 4 (Từ 50 tỷ trở lên)")
    void testUpdateBusinessProfile_Group4() {
        when(userRepository.findByCccd("079201001234")).thenReturn(Optional.of(mockUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BusinessProfileRequest req = BusinessProfileRequest.builder()
                .businessGroup(4)
                .businessType("Bán lẻ")
                .businessName("Chuỗi siêu thị Việt")
                .build();

        UserDto result = userService.updateBusinessProfile("079201001234", req);

        assertNotNull(result);
        assertEquals(4, result.getBusinessGroup());
        assertEquals("Từ 50 tỷ trở lên", result.getBusinessRevenueRange());
        assertEquals("Bán lẻ", result.getBusinessType());
    }

    @Test
    @DisplayName("Cập nhật loại hình kinh doanh là Khác với mô tả chi tiết thành công")
    void testUpdateBusinessProfile_OtherType_Success() {
        when(userRepository.findByCccd("079201001234")).thenReturn(Optional.of(mockUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BusinessProfileRequest req = BusinessProfileRequest.builder()
                .businessGroup(1)
                .businessType("Khác")
                .otherBusinessType("Tiệm đồ gốm thủ công nghệ thuật")
                .businessName("Gốm Việt")
                .build();

        UserDto result = userService.updateBusinessProfile("079201001234", req);

        assertNotNull(result);
        assertEquals(1, result.getBusinessGroup());
        assertEquals("Dưới 1 tỷ", result.getBusinessRevenueRange());
        assertEquals("Khác", result.getBusinessType());
        assertEquals("Tiệm đồ gốm thủ công nghệ thuật", result.getOtherBusinessType());
    }

    @Test
    @DisplayName("Cập nhật loại hình kinh doanh là Khác nhưng thiếu mô tả chi tiết thì báo lỗi BAD_REQUEST")
    void testUpdateBusinessProfile_OtherType_MissingDescription() {
        when(userRepository.findByCccd("079201001234")).thenReturn(Optional.of(mockUser));

        BusinessProfileRequest req = BusinessProfileRequest.builder()
                .businessGroup(1)
                .businessType("Khác")
                .otherBusinessType("") // rỗng
                .build();

        AppException ex = assertThrows(AppException.class, () -> userService.updateBusinessProfile("079201001234", req));
        assertEquals("Vui lòng nhập tên loại hình kinh doanh cụ thể cho mục 'Khác'", ex.getMessage());
        verify(userRepository, never()).save(any());
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

    @Test
    @DisplayName("Đăng xuất thành công và xóa thông tin SecurityContext")
    void testLogout_Success() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("079201001234", null, Collections.emptyList())
        );
        assertNotNull(SecurityContextHolder.getContext().getAuthentication());

        userService.logout("079201001234");

        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }
}
