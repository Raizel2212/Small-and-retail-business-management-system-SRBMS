package com.srbms.service.impl;

import com.srbms.dto.UserDto;
import com.srbms.dto.request.BusinessProfileRequest;
import com.srbms.entity.HouseholdBusiness;
import com.srbms.entity.User;
import com.srbms.enums.BusinessCategory;
import com.srbms.enums.BusinessGroup;
import com.srbms.exception.AppException;
import com.srbms.repository.HouseholdBusinessRepository;
import com.srbms.repository.UserRepository;
import com.srbms.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final HouseholdBusinessRepository householdBusinessRepository;

    public UserServiceImpl(UserRepository userRepository, HouseholdBusinessRepository householdBusinessRepository) {
        this.userRepository = userRepository;
        this.householdBusinessRepository = householdBusinessRepository;
    }

    @Override
    @Transactional
    public UserDto updateBusinessProfile(String cccd, BusinessProfileRequest request) {
        User user = userRepository.findByCccd(cccd)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy thông tin tài khoản người dùng"));

        // Kiểm tra nếu loại hình kinh doanh là "Khác" thì bắt buộc phải nhập mô tả chi tiết
        if (isOtherBusinessType(request.getBusinessType())) {
            if (request.getOtherBusinessType() == null || request.getOtherBusinessType().trim().isEmpty()) {
                throw new AppException(HttpStatus.BAD_REQUEST, "Vui lòng nhập tên loại hình kinh doanh cụ thể cho mục 'Khác'");
            }
        }

        // Tự động gán mức doanh thu tương ứng theo nhóm hộ kinh doanh nếu request không truyền riêng
        BusinessGroup bg = BusinessGroup.fromGroupNumber(request.getBusinessGroup());
        String calculatedRevenueRange;
        if (request.getRevenueRange() != null && !request.getRevenueRange().isBlank()) {
            calculatedRevenueRange = request.getRevenueRange().trim();
        } else if (bg != null) {
            calculatedRevenueRange = bg.getRevenueRange();
        } else {
            calculatedRevenueRange = "Dưới 1 tỷ";
        }

        // Chuẩn hóa loại hình kinh doanh (nếu truyền mã code thì chuyển sang nhãn thân thiện)
        String typeInput = request.getBusinessType().trim();
        BusinessCategory category = BusinessCategory.fromCode(typeInput);
        String finalBusinessType = category != null ? category.getLabel() : typeInput;

        String finalOtherType = (request.getOtherBusinessType() != null && !request.getOtherBusinessType().isBlank())
                ? request.getOtherBusinessType().trim()
                : null;

        String finalBusinessName = (request.getBusinessName() != null && !request.getBusinessName().isBlank())
                ? request.getBusinessName().trim()
                : null;

        // Lưu / cập nhật vào Entity chuyên biệt HouseholdBusiness
        HouseholdBusiness householdBusiness = householdBusinessRepository.findByUser(user)
                .orElseGet(() -> HouseholdBusiness.builder().user(user).build());

        householdBusiness.setBusinessGroup(request.getBusinessGroup());
        householdBusiness.setRevenueRange(calculatedRevenueRange);
        householdBusiness.setBusinessType(finalBusinessType);
        householdBusiness.setOtherBusinessType(finalOtherType);
        householdBusiness.setBusinessName(finalBusinessName);
        householdBusinessRepository.save(householdBusiness);

        // Đồng thời cập nhật trường trên User để đảm bảo đồng bộ
        user.setBusinessGroup(request.getBusinessGroup());
        user.setBusinessRevenueRange(calculatedRevenueRange);
        user.setBusinessType(finalBusinessType);
        user.setOtherBusinessType(finalOtherType);
        user.setBusinessName(finalBusinessName);
        user.setHouseholdBusiness(householdBusiness);

        // Đã hoàn tất cấu hình hộ kinh doanh -> không còn là lần đầu đăng nhập
        user.setIsFirstLogin(false);

        User savedUser = userRepository.save(user);
        return mapToDto(savedUser);
    }

    @Override
    @Transactional(readOnly = true)
    public UserDto getBusinessProfile(String cccd) {
        return getCurrentUser(cccd);
    }

    @Override
    @Transactional(readOnly = true)
    public UserDto getCurrentUser(String cccd) {
        User user = userRepository.findByCccd(cccd)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy thông tin tài khoản người dùng"));
        return mapToDto(user);
    }

    @Override
    public void logout(String cccd) {
        SecurityContextHolder.clearContext();
    }

    private boolean isOtherBusinessType(String businessType) {
        if (businessType == null) {
            return false;
        }
        String normalized = businessType.trim().toLowerCase();
        return normalized.equals("khác") || normalized.equals("khac") || normalized.equals("other");
    }

    private UserDto mapToDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setCccd(user.getCccd());
        dto.setUsername(user.getUsername());
        dto.setFullName(user.getFullName());
        dto.setSdt(user.getSdt());
        dto.setEmail(user.getEmail());
        dto.setDateOfBirth(user.getDateOfBirth());
        dto.setRole(user.getRole());
        dto.setStatus(user.getStatus());
        dto.setIsFirstLogin(user.getIsFirstLogin());
        dto.setBusinessGroup(user.getBusinessGroup());
        dto.setBusinessRevenueRange(user.getBusinessRevenueRange());
        dto.setBusinessType(user.getBusinessType());
        dto.setOtherBusinessType(user.getOtherBusinessType());
        dto.setBusinessName(user.getBusinessName());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        return dto;
    }
}
