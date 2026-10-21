package com.srbms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDto {
    private Long id;
    private String cccd;
    private String username;
    private String fullName;
    private String sdt;
    private String email;
    private LocalDate dateOfBirth;
    private String role;
    private String status;
    private Boolean isFirstLogin;
    private Integer businessGroup;
    private String businessRevenueRange;
    private String businessType;
    private String otherBusinessType;
    private String businessName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
