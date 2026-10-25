package com.srbms.controller;

import com.srbms.dto.request.CreateExpenseRequest;
import com.srbms.dto.request.UpdateExpenseRequest;
import com.srbms.dto.response.ApiResponse;
import com.srbms.dto.response.ExpenseItemDto;
import com.srbms.dto.response.ExpenseSummaryResponse;
import com.srbms.dto.response.ProductSuggestionDto;
import com.srbms.service.ExpenseService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/expenses")
public class ExpenseController {

    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<ExpenseSummaryResponse>> getExpenseSummary(
            Authentication authentication,
            @RequestParam(required = false, defaultValue = "month") String period,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer quarter) {
        String cccd = authentication.getName();
        ExpenseSummaryResponse summary = expenseService.getExpenseSummary(cccd, period, year, month, quarter);
        return ResponseEntity.ok(ApiResponse.ok("Lấy chi tiết chi phí nhập hàng thành công", summary));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ExpenseItemDto>> createExpense(
            Authentication authentication,
            @Valid @RequestBody CreateExpenseRequest request) {
        String cccd = authentication.getName();
        ExpenseItemDto created = expenseService.createExpense(cccd, request);
        return ResponseEntity.ok(ApiResponse.ok("Thêm hàng mua vào danh sách chi phí thành công", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ExpenseItemDto>> updateExpense(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody UpdateExpenseRequest request) {
        String cccd = authentication.getName();
        ExpenseItemDto updated = expenseService.updateExpense(cccd, id, request);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật khoản chi phí nhập hàng thành công", updated));
    }

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<ApiResponse<ExpenseItemDto>> togglePaymentStatus(
            Authentication authentication,
            @PathVariable Long id) {
        String cccd = authentication.getName();
        ExpenseItemDto updated = expenseService.togglePaymentStatus(cccd, id);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật trạng thái thanh toán thành công", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteExpense(
            Authentication authentication,
            @PathVariable Long id) {
        String cccd = authentication.getName();
        expenseService.deleteExpense(cccd, id);
        return ResponseEntity.ok(ApiResponse.ok("Xóa khoản chi phí thành công", null));
    }

    @GetMapping("/product-suggestions")
    public ResponseEntity<ApiResponse<List<ProductSuggestionDto>>> getProductSuggestions(
            Authentication authentication,
            @RequestParam(required = false) String keyword) {
        String cccd = authentication.getName();
        List<ProductSuggestionDto> suggestions = expenseService.getProductSuggestions(cccd, keyword);
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh mục sản phẩm và giá gợi ý thành công", suggestions));
    }
}
