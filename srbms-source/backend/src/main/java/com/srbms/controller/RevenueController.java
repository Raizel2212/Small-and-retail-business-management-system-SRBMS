package com.srbms.controller;

import com.srbms.dto.request.CreateRevenueRequest;
import com.srbms.dto.response.ApiResponse;
import com.srbms.dto.response.RevenueItemDto;
import com.srbms.dto.response.RevenueSummaryResponse;
import com.srbms.service.RevenueService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/revenue")
public class RevenueController {

    private final RevenueService revenueService;

    public RevenueController(RevenueService revenueService) {
        this.revenueService = revenueService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<RevenueSummaryResponse>> getRevenueSummary(
            Authentication authentication,
            @RequestParam(required = false, defaultValue = "month") String period,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer quarter) {
        String cccd = authentication.getName();
        RevenueSummaryResponse summary = revenueService.getRevenueSummary(cccd, period, year, month, quarter);
        return ResponseEntity.ok(ApiResponse.ok("Lấy chi tiết doanh thu thành công", summary));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<RevenueItemDto>> createRevenue(
            Authentication authentication,
            @Valid @RequestBody CreateRevenueRequest request) {
        String cccd = authentication.getName();
        RevenueItemDto created = revenueService.createRevenue(cccd, request);
        return ResponseEntity.ok(ApiResponse.ok("Tạo khoản doanh thu thành công", created));
    }

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<ApiResponse<RevenueItemDto>> togglePaymentStatus(
            Authentication authentication,
            @PathVariable Long id) {
        String cccd = authentication.getName();
        RevenueItemDto updated = revenueService.togglePaymentStatus(cccd, id);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật trạng thái thu tiền thành công", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteRevenue(
            Authentication authentication,
            @PathVariable Long id) {
        String cccd = authentication.getName();
        revenueService.deleteRevenue(cccd, id);
        return ResponseEntity.ok(ApiResponse.ok("Xóa khoản doanh thu thành công", null));
    }
}
