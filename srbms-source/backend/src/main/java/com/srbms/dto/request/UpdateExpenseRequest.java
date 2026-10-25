package com.srbms.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
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
public class UpdateExpenseRequest {

    @NotBlank(message = "Tên nhà cung cấp / người bán không được để trống")
    private String supplierName;

    @NotBlank(message = "Tên hàng hóa không được để trống")
    private String productName;

    @NotNull(message = "Số lượng không được để trống")
    @Min(value = 1, message = "Số lượng phải lớn hơn 0")
    private Integer quantity;

    @NotNull(message = "Đơn giá nhập không được để trống")
    @DecimalMin(value = "0.0", message = "Đơn giá nhập không được âm")
    private BigDecimal unitPrice;

    private BigDecimal amount;

    private BigDecimal suggestedSellingPrice;

    private String unit;

    private String category;

    private LocalDate transactionDate;

    private String paymentMethod;

    private String paymentStatus;

    private String note;
}
