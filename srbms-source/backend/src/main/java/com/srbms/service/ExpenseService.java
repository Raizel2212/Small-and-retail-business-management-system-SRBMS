package com.srbms.service;

import com.srbms.dto.request.CreateExpenseRequest;
import com.srbms.dto.request.UpdateExpenseRequest;
import com.srbms.dto.response.ExpenseItemDto;
import com.srbms.dto.response.ExpenseSummaryResponse;
import com.srbms.dto.response.ProductSuggestionDto;

import java.util.List;

public interface ExpenseService {

    ExpenseSummaryResponse getExpenseSummary(String cccd, String period, Integer year, Integer month, Integer quarter);

    ExpenseItemDto createExpense(String cccd, CreateExpenseRequest request);

    ExpenseItemDto updateExpense(String cccd, Long id, UpdateExpenseRequest request);

    ExpenseItemDto togglePaymentStatus(String cccd, Long id);

    void deleteExpense(String cccd, Long id);

    List<ProductSuggestionDto> getProductSuggestions(String cccd, String keyword);
}
