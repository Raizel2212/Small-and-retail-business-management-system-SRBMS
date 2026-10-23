package com.srbms.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateRevenueRequest {

    @NotBlank(message = "Tên người mua không được để trống")
    private String customerName;

    @NotNull(message = "Số tiền không được để trống")
    @DecimalMin(value = "1.0", message = "Số tiền phải lớn hơn 0")
    private BigDecimal amount;

    private LocalDate transactionDate;

    private String productName;

    @Builder.Default
    private Integer quantity = 0;

    private BigDecimal unitPrice;

    @Builder.Default
    private Boolean isRetailCustomer = false;

    // TIEN_MAT hoặc CHUYEN_KHOAN
    @Builder.Default
    private String paymentMethod = "TIEN_MAT";

    // DA_THU hoặc CHUA_THU
    @Builder.Default
    private String paymentStatus = "DA_THU";

    private String note;
}
