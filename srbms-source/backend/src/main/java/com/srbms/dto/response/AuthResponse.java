package com.srbms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {
    private String accessToken;
    @Builder.Default
    private String tokenType = "Bearer";
    private Long expiresIn;
    private UserSummary user;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserSummary {
        private Long id;
        private String cccd;
        private String username;
        private String fullName;
        private String email;
        private String sdt;
        private String role;
        private String status;
        private Boolean isFirstLogin;
        private Integer businessGroup;
        private String businessType;
        private String otherBusinessType;
        private String businessName;
    }
}
