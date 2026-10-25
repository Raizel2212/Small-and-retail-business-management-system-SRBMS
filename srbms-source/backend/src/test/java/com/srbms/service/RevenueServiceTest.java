package com.srbms.service;

import com.srbms.dto.request.CreateRevenueRequest;
import com.srbms.dto.response.RevenueItemDto;
import com.srbms.dto.response.RevenueSummaryResponse;
import com.srbms.entity.RevenueTransaction;
import com.srbms.entity.User;
import com.srbms.repository.RevenueRepository;
import com.srbms.repository.UserRepository;
import com.srbms.service.impl.RevenueServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RevenueServiceTest {

    @Mock
    private RevenueRepository revenueRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ExpenseService expenseService;

    @InjectMocks
    private RevenueServiceImpl revenueService;

    private User mockUser;

    @BeforeEach
    void setUp() {
        mockUser = User.builder()
                .id(1L)
                .cccd("079201001234")
                .fullName("Nguyễn văn A")
                .build();
    }

    @Test
    @DisplayName("Lấy tổng kết doanh thu và tính toán đúng số tiền tiền mặt và chưa thu")
    void testGetRevenueSummary_Success() {
        when(userRepository.findByCccd("079201001234")).thenReturn(Optional.of(mockUser));
        when(revenueRepository.countByUser(mockUser)).thenReturn(2L);

        RevenueTransaction tx1 = RevenueTransaction.builder()
                .id(1L)
                .user(mockUser)
                .transactionDate(LocalDate.now())
                .customerName("Nguyễn văn A")
                .amount(new BigDecimal("1000000"))
                .paymentMethod("TIEN_MAT")
                .paymentStatus("DA_THU")
                .build();

        RevenueTransaction tx2 = RevenueTransaction.builder()
                .id(2L)
                .user(mockUser)
                .transactionDate(LocalDate.now())
                .customerName("Phan tú Q")
                .amount(new BigDecimal("2000000"))
                .paymentMethod("TIEN_MAT")
                .paymentStatus("CHUA_THU")
                .build();

        when(revenueRepository.findByUserAndTransactionDateBetweenOrderByTransactionDateDescIdDesc(
                eq(mockUser), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of(tx1, tx2));

        RevenueSummaryResponse response = revenueService.getRevenueSummary("079201001234", "month", 2026, 10, null);

        assertNotNull(response);
        assertEquals(new BigDecimal("3000000"), response.getTotalRevenue());
        assertEquals("3.000.000", response.getTotalRevenueFormatted());
        assertEquals(new BigDecimal("1000000"), response.getTotalCash());
        assertEquals("1.000.000", response.getTotalCashFormatted());
        assertEquals(new BigDecimal("2000000"), response.getTotalUnpaid());
        assertEquals("2.000.000", response.getTotalUnpaidFormatted());
        assertEquals(2, response.getItems().size());

        // Check green and black requirement
        assertTrue(response.getItems().get(0).getIsPaid());
        assertEquals("Đã thu tiền", response.getItems().get(0).getPaymentStatusLabel());
        assertFalse(response.getItems().get(1).getIsPaid());
        assertEquals("Chưa thu tiền", response.getItems().get(1).getPaymentStatusLabel());
    }

    @Test
    @DisplayName("Tạo mới khoản doanh thu thành công")
    void testCreateRevenue_Success() {
        when(userRepository.findByCccd("079201001234")).thenReturn(Optional.of(mockUser));

        CreateRevenueRequest request = CreateRevenueRequest.builder()
                .customerName("Trần Văn B")
                .productName("Cà phê Robusta")
                .quantity(2)
                .unitPrice(new BigDecimal("250000"))
                .amount(new BigDecimal("500000"))
                .isRetailCustomer(false)
                .paymentMethod("TIEN_MAT")
                .paymentStatus("DA_THU")
                .build();

        when(revenueRepository.save(any(RevenueTransaction.class))).thenAnswer(inv -> {
            RevenueTransaction t = inv.getArgument(0);
            t.setId(10L);
            return t;
        });

        RevenueItemDto result = revenueService.createRevenue("079201001234", request);

        assertNotNull(result);
        assertEquals(10L, result.getId());
        assertEquals("Trần Văn B", result.getCustomerName());
        assertEquals("Cà phê Robusta", result.getProductName());
        assertEquals(2, result.getQuantity());
        assertEquals(new BigDecimal("250000"), result.getUnitPrice());
        assertEquals("250.000", result.getUnitPriceFormatted());
        assertEquals(new BigDecimal("500000"), result.getAmount());
        assertEquals("500.000", result.getAmountFormatted());
        assertFalse(result.getIsRetailCustomer());
        assertTrue(result.getIsPaid());
    }

    @Test
    @DisplayName("Chuyển đổi trạng thái Đã thu tiền thành Chưa thu tiền")
    void testTogglePaymentStatus_Success() {
        when(userRepository.findByCccd("079201001234")).thenReturn(Optional.of(mockUser));

        RevenueTransaction tx = RevenueTransaction.builder()
                .id(1L)
                .user(mockUser)
                .transactionDate(LocalDate.now())
                .customerName("Nguyễn văn A")
                .amount(new BigDecimal("1000000"))
                .paymentMethod("TIEN_MAT")
                .paymentStatus("DA_THU")
                .build();

        when(revenueRepository.findById(1L)).thenReturn(Optional.of(tx));
        when(revenueRepository.save(any(RevenueTransaction.class))).thenAnswer(inv -> inv.getArgument(0));

        RevenueItemDto result = revenueService.togglePaymentStatus("079201001234", 1L);

        assertNotNull(result);
        assertFalse(result.getIsPaid());
        assertEquals("Chưa thu tiền", result.getPaymentStatusLabel());
    }

    @Test
    @DisplayName("Lấy danh mục sản phẩm và giá gợi ý từ chi phí nhập hàng")
    void testGetProductSuggestions_Success() {
        com.srbms.dto.response.ProductSuggestionDto suggestion = com.srbms.dto.response.ProductSuggestionDto.builder()
                .productName("Cà phê Robusta Đắk Lắk")
                .unit("kg")
                .latestCostPrice(new BigDecimal("180000"))
                .suggestedSellingPrice(new BigDecimal("250000"))
                .build();

        when(expenseService.getProductSuggestions("079201001234", null)).thenReturn(List.of(suggestion));

        List<com.srbms.dto.response.ProductSuggestionDto> result = revenueService.getProductSuggestions("079201001234", null);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Cà phê Robusta Đắk Lắk", result.get(0).getProductName());
        assertEquals(new BigDecimal("250000"), result.get(0).getSuggestedSellingPrice());
        verify(expenseService).getProductSuggestions("079201001234", null);
    }
}

