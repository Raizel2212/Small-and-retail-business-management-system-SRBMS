package com.srbms.controller;

import com.srbms.dto.UserDto;
import com.srbms.dto.request.BusinessProfileRequest;
import com.srbms.dto.response.ApiResponse;
import com.srbms.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/user")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PutMapping("/business-profile")
    public ResponseEntity<ApiResponse<UserDto>> updateBusinessProfile(
            Authentication authentication,
            @Valid @RequestBody BusinessProfileRequest request) {
        String cccd = authentication.getName();
        UserDto updatedUser = userService.updateBusinessProfile(cccd, request);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật thông tin hộ kinh doanh thành công", updatedUser));
    }

    @PostMapping("/business-profile")
    public ResponseEntity<ApiResponse<UserDto>> createOrUpdateBusinessProfile(
            Authentication authentication,
            @Valid @RequestBody BusinessProfileRequest request) {
        return updateBusinessProfile(authentication, request);
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> getCurrentUser(Authentication authentication) {
        String cccd = authentication.getName();
        UserDto userDto = userService.getCurrentUser(cccd);
        return ResponseEntity.ok(ApiResponse.ok("Lấy thông tin người dùng thành công", userDto));
    }
}
