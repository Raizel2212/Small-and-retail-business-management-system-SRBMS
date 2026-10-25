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
public class ProductSuggestionDto {
    private Long id;
    private String productCode;
    private String productName;
    private String unit;
    private String category;

    // Đơn giá nhập gần nhất từ phần chi phí
    private BigDecimal latestCostPrice;
    private String latestCostPriceFormatted;

    // Giá bán gợi ý cho phần Doanh thu
    private BigDecimal suggestedSellingPrice;
    private String suggestedSellingPriceFormatted;

    // Tổng số lượng hàng đã nhập
    private Integer totalImportedQuantity;

    private LocalDate lastImportDate;
    private String lastImportDateFormatted;
    private String lastSupplier;
}
