package com.srbms.dto.response;

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
public class ExpenseItemDto {
    private Long id;
    private Integer stt;
    private LocalDate transactionDate;
    private String transactionDateFormatted; // "16/10/2026"
    private String supplierName;             // "Đại lý phân phối cà phê Minh Hải"
    private String productName;              // "Cà phê Robusta Đắk Lắk"
    private String category;                 // "HANG_HOA"
    private String categoryLabel;            // "Hàng hóa nhập bán"
    private String unit;                     // "kg", "cái", "hộp"
    private Integer quantity;                // 20
    private BigDecimal unitPrice;            // 180000
    private String unitPriceFormatted;       // "180.000"
    private BigDecimal amount;               // 3600000
    private String amountFormatted;          // "3.600.000"
    private BigDecimal suggestedSellingPrice;// 250000
    private String suggestedSellingPriceFormatted; // "250.000"
    private String paymentMethod;            // "TIEN_MAT" / "CHUYEN_KHOAN"
    private String paymentMethodLabel;       // "Tiền mặt" / "Chuyển khoản"
    private String paymentStatus;            // "DA_THANH_TOAN" / "CHUA_THANH_TOAN"
    private String paymentStatusLabel;       // "Đã thanh toán" / "Chưa thanh toán"
    private Boolean isPaid;                  // true / false
    private String note;
}
