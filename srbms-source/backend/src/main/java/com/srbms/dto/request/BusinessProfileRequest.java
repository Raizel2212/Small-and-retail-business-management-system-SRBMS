package com.srbms.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BusinessProfileRequest {

    @NotNull(message = "Vui lòng chọn nhóm hộ kinh doanh (từ nhóm 1 đến nhóm 4)")
    @Min(value = 1, message = "Nhóm hộ kinh doanh nhỏ nhất là 1")
    @Max(value = 4, message = "Nhóm hộ kinh doanh lớn nhất là 4")
    private Integer businessGroup;

    @NotBlank(message = "Vui lòng chọn loại hình kinh doanh")
    private String businessType;

    private String otherBusinessType;

    private String businessName;

    private String revenueRange;
}
