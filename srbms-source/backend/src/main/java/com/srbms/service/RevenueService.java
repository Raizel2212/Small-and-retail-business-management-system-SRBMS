package com.srbms.service;

import com.srbms.dto.request.CreateRevenueRequest;
import com.srbms.dto.response.ProductSuggestionDto;
import com.srbms.dto.response.RevenueItemDto;
import com.srbms.dto.response.RevenueSummaryResponse;

import java.util.List;

public interface RevenueService {

    RevenueSummaryResponse getRevenueSummary(String cccd, String period, Integer year, Integer month, Integer quarter);

    RevenueItemDto createRevenue(String cccd, CreateRevenueRequest request);

    RevenueItemDto togglePaymentStatus(String cccd, Long id);

    void deleteRevenue(String cccd, Long id);

    List<ProductSuggestionDto> getProductSuggestions(String cccd, String keyword);
}
