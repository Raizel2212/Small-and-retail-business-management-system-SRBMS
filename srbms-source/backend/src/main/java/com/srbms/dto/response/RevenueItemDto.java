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
public class RevenueItemDto {
    private Long id;
    private Integer stt;
    private LocalDate transactionDate;
    private String transactionDateFormatted; // "16/10/2026"
    private String customerName;             // "Nguyễn văn A"
    private BigDecimal amount;               // 1000000
    private String amountFormatted;          // "1.000.000"
    private String paymentMethod;            // "TIEN_MAT" / "CHUYEN_KHOAN"
    private String paymentMethodLabel;       // "Tiền mặt" / "Chuyển khoản"
    private String paymentStatus;            // "DA_THU" / "CHUA_THU"
    private String paymentStatusLabel;       // "Đã thu tiền" / "Chưa thu tiền"
    private Boolean isPaid;                  // true / false
    private String note;
}
