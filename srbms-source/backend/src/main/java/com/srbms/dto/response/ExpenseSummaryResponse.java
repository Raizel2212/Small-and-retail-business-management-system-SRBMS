package com.srbms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpenseSummaryResponse {
    // Tổng chi phí cuối danh sách
    private BigDecimal totalExpense;
    private String totalExpenseFormatted;      // "37.300.000"

    // Chi tiết theo phương thức và trạng thái
    private BigDecimal totalCash;
    private String totalCashFormatted;         // "3.600.000"

    private BigDecimal totalTransfer;
    private String totalTransferFormatted;     // "29.500.000"

    private BigDecimal totalUnpaid;
    private String totalUnpaidFormatted;       // "4.200.000"

    private Integer totalQuantity;             // Tổng số lượng hàng nhập

    private String period;                     // "month" | "quarter" | "year" | "all"
    private String periodLabel;                // "Tháng 10/2026"

    private int totalRecords;
    private List<ExpenseItemDto> items;
}
