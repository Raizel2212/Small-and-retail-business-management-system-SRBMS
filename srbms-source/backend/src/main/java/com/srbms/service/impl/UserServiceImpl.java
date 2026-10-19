package com.srbms.service.impl;

import com.srbms.dto.UserDto;
import com.srbms.dto.request.BusinessProfileRequest;
import com.srbms.entity.User;
import com.srbms.exception.AppException;
import com.srbms.repository.UserRepository;
import com.srbms.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    public UserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public UserDto updateBusinessProfile(String cccd, BusinessProfileRequest request) {
        User user = userRepository.findByCccd(cccd)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy thông tin tài khoản người dùng"));

        user.setBusinessGroup(request.getBusinessGroup());
        user.setBusinessType(request.getBusinessType());
        user.setOtherBusinessType(request.getOtherBusinessType());
        if (request.getBusinessName() != null && !request.getBusinessName().isBlank()) {
            user.setBusinessName(request.getBusinessName().trim());
        }
        
        // Đã hoàn tất điền thông tin hộ kinh doanh -> không còn là lần đầu đăng nhập
        user.setIsFirstLogin(false);

        User savedUser = userRepository.save(user);
        return mapToDto(savedUser);
    }

    @Override
    @Transactional(readOnly = true)
    public UserDto getCurrentUser(String cccd) {
        User user = userRepository.findByCccd(cccd)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy thông tin tài khoản người dùng"));
        return mapToDto(user);
    }

    private UserDto mapToDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .cccd(user.getCccd())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .sdt(user.getSdt())
                .email(user.getEmail())
                .dateOfBirth(user.getDateOfBirth())
                .role(user.getRole())
                .status(user.getStatus())
                .isFirstLogin(user.getIsFirstLogin())
                .businessGroup(user.getBusinessGroup())
                .businessType(user.getBusinessType())
                .otherBusinessType(user.getOtherBusinessType())
                .businessName(user.getBusinessName())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
