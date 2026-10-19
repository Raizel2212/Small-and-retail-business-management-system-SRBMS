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
public class RevenueSummaryResponse {
    private BigDecimal totalRevenue;
    private String totalRevenueFormatted;     // "30.000.000"

    private BigDecimal totalCash;
    private String totalCashFormatted;        // "1.000.000"

    private BigDecimal totalTransfer;
    private String totalTransferFormatted;    // "-" or "27.000.000"

    private BigDecimal totalUnpaid;
    private String totalUnpaidFormatted;      // "2.000.000"

    private String period;                    // "all" | "month" | "quarter" | "year"
    private String periodLabel;               // "Tháng/Quý/ Năm" or "Tháng 10/2026"

    private int totalRecords;
    private List<RevenueItemDto> items;
}
