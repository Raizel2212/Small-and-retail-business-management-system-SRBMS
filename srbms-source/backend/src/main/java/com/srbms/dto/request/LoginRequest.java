package com.srbms.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginRequest {

    @NotBlank(message = "Vui lòng nhập thông tin đăng nhập (Email, Số điện thoại hoặc số CCCD)")
    private String cccd;

    @NotBlank(message = "Vui lòng nhập mật khẩu")
    private String password;
}
