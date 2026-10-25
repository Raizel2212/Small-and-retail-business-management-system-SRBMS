package com.srbms.service;

import com.srbms.dto.request.CreateExpenseRequest;
import com.srbms.dto.request.UpdateExpenseRequest;
import com.srbms.dto.response.ExpenseItemDto;
import com.srbms.dto.response.ExpenseSummaryResponse;
import com.srbms.dto.response.ProductSuggestionDto;
import com.srbms.entity.ExpenseTransaction;
import com.srbms.entity.Product;
import com.srbms.entity.User;
import com.srbms.exception.AppException;
import com.srbms.repository.ExpenseRepository;
import com.srbms.repository.ProductRepository;
import com.srbms.repository.UserRepository;
import com.srbms.service.impl.ExpenseServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExpenseServiceTest {

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ExpenseServiceImpl expenseService;

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
    @DisplayName("Lấy tổng kết chi phí và tính toán đúng số tiền tổng, tiền mặt, chuyển khoản và công nợ")
    void testGetExpenseSummary_Success() {
        when(userRepository.findByCccd("079201001234")).thenReturn(Optional.of(mockUser));
        when(expenseRepository.countByUser(mockUser)).thenReturn(2L);

        ExpenseTransaction tx1 = ExpenseTransaction.builder()
                .id(1L)
                .user(mockUser)
                .transactionDate(LocalDate.now())
                .supplierName("Đại lý Minh Hải")
                .productName("Cà phê Robusta")
                .unit("kg")
                .quantity(10)
                .unitPrice(new BigDecimal("180000"))
                .amount(new BigDecimal("1800000"))
                .suggestedSellingPrice(new BigDecimal("250000"))
                .paymentMethod("TIEN_MAT")
                .paymentStatus("DA_THANH_TOAN")
                .build();

        ExpenseTransaction tx2 = ExpenseTransaction.builder()
                .id(2L)
                .user(mockUser)
                .transactionDate(LocalDate.now())
                .supplierName("Công ty Thực Phẩm Xanh")
                .productName("Bột ngũ cốc dinh dưỡng")
                .unit("hộp")
                .quantity(20)
                .unitPrice(new BigDecimal("140000"))
                .amount(new BigDecimal("2800000"))
                .suggestedSellingPrice(new BigDecimal("200000"))
                .paymentMethod("TIEN_MAT")
                .paymentStatus("CHUA_THANH_TOAN")
                .build();

        when(expenseRepository.findByUserAndTransactionDateBetweenOrderByTransactionDateDescIdDesc(
                eq(mockUser), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of(tx1, tx2));

        ExpenseSummaryResponse summary = expenseService.getExpenseSummary("079201001234", "month", null, null, null);

        assertNotNull(summary);
        assertEquals(new BigDecimal("4600000"), summary.getTotalExpense());
        assertEquals("4.600.000", summary.getTotalExpenseFormatted());
        assertEquals(new BigDecimal("1800000"), summary.getTotalCash());
        assertEquals(new BigDecimal("2800000"), summary.getTotalUnpaid());
        assertEquals(30, summary.getTotalQuantity());
        assertEquals(2, summary.getTotalRecords());
        assertEquals(2, summary.getItems().size());
    }

    @Test
    @DisplayName("Thêm hàng mua mới vào danh sách chi phí và tự động đồng bộ vào danh mục sản phẩm gợi ý")
    void testCreateExpense_Success_SyncsToProductCatalog() {
        when(userRepository.findByCccd("079201001234")).thenReturn(Optional.of(mockUser));

        CreateExpenseRequest request = CreateExpenseRequest.builder()
                .supplierName("Đại lý Cà Phê Trung Nguyên")
                .productName("Cà phê Chồn Cao Cấp")
                .unit("hộp")
                .quantity(5)
                .unitPrice(new BigDecimal("800000"))
                .suggestedSellingPrice(new BigDecimal("1200000"))
                .paymentMethod("CHUYEN_KHOAN")
                .paymentStatus("DA_THANH_TOAN")
                .build();

        when(expenseRepository.save(any(ExpenseTransaction.class))).thenAnswer(inv -> {
            ExpenseTransaction tx = inv.getArgument(0);
            tx.setId(10L);
            return tx;
        });

        when(productRepository.findByUserAndNameIgnoreCase(mockUser, "Cà phê Chồn Cao Cấp")).thenReturn(Optional.empty());
        when(productRepository.count()).thenReturn(0L);

        ExpenseItemDto result = expenseService.createExpense("079201001234", request);

        assertNotNull(result);
        assertEquals(10L, result.getId());
        assertEquals("Đại lý Cà Phê Trung Nguyên", result.getSupplierName());
        assertEquals("Cà phê Chồn Cao Cấp", result.getProductName());
        assertEquals(new BigDecimal("4000000"), result.getAmount()); // 5 * 800.000
        assertEquals("Chuyển khoản", result.getPaymentMethodLabel());
        assertEquals("Đã thanh toán", result.getPaymentStatusLabel());
        assertTrue(result.getIsPaid());

        // Kiểm tra sản phẩm đã được đồng bộ vào bảng products
        verify(productRepository).save(argThat(prod ->
                prod.getName().equals("Cà phê Chồn Cao Cấp") &&
                prod.getLatestCostPrice().equals(new BigDecimal("800000")) &&
                prod.getSuggestedSellingPrice().equals(new BigDecimal("1200000")) &&
                prod.getTotalImportedQuantity() == 5
        ));
    }

    @Test
    @DisplayName("Chuyển đổi trạng thái thanh toán Đã thanh toán <-> Chưa thanh toán")
    void testTogglePaymentStatus_Success() {
        when(userRepository.findByCccd("079201001234")).thenReturn(Optional.of(mockUser));

        ExpenseTransaction tx = ExpenseTransaction.builder()
                .id(1L)
                .user(mockUser)
                .transactionDate(LocalDate.now())
                .supplierName("Đại lý Minh Hải")
                .productName("Cà phê Robusta")
                .quantity(10)
                .unitPrice(new BigDecimal("180000"))
                .amount(new BigDecimal("1800000"))
                .paymentMethod("TIEN_MAT")
                .paymentStatus("DA_THANH_TOAN")
                .build();

        when(expenseRepository.findById(1L)).thenReturn(Optional.of(tx));
        when(expenseRepository.save(any(ExpenseTransaction.class))).thenAnswer(inv -> inv.getArgument(0));

        ExpenseItemDto result = expenseService.togglePaymentStatus("079201001234", 1L);

        assertNotNull(result);
        assertFalse(result.getIsPaid());
        assertEquals("Chưa thanh toán", result.getPaymentStatusLabel());
    }

    @Test
    @DisplayName("Xóa khoản chi phí thành công")
    void testDeleteExpense_Success() {
        when(userRepository.findByCccd("079201001234")).thenReturn(Optional.of(mockUser));

        ExpenseTransaction tx = ExpenseTransaction.builder()
                .id(1L)
                .user(mockUser)
                .build();

        when(expenseRepository.findById(1L)).thenReturn(Optional.of(tx));

        expenseService.deleteExpense("079201001234", 1L);

        verify(expenseRepository).delete(tx);
    }

    @Test
    @DisplayName("Không được xóa khoản chi phí của người dùng khác (FORBIDDEN)")
    void testDeleteExpense_Forbidden() {
        User otherUser = User.builder().id(999L).build();
        when(userRepository.findByCccd("079201001234")).thenReturn(Optional.of(mockUser));

        ExpenseTransaction tx = ExpenseTransaction.builder()
                .id(1L)
                .user(otherUser)
                .build();

        when(expenseRepository.findById(1L)).thenReturn(Optional.of(tx));

        AppException ex = assertThrows(AppException.class, () ->
                expenseService.deleteExpense("079201001234", 1L));

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
        verify(expenseRepository, never()).delete(any());
    }

    @Test
    @DisplayName("Lấy danh mục sản phẩm và giá gợi ý cho doanh thu từ chi phí nhập hàng")
    void testGetProductSuggestions_Success() {
        when(userRepository.findByCccd("079201001234")).thenReturn(Optional.of(mockUser));

        Product p1 = Product.builder()
                .id(1L)
                .user(mockUser)
                .productCode("SP01")
                .name("Cà phê Robusta Đắk Lắk")
                .unit("kg")
                .category("HANG_HOA")
                .latestCostPrice(new BigDecimal("180000"))
                .suggestedSellingPrice(new BigDecimal("250000"))
                .totalImportedQuantity(50)
                .lastImportDate(LocalDate.now())
                .lastSupplier("Đại lý Minh Hải")
                .build();

        when(productRepository.findByUserOrderByNameAsc(mockUser)).thenReturn(List.of(p1));

        List<ProductSuggestionDto> suggestions = expenseService.getProductSuggestions("079201001234", null);

        assertNotNull(suggestions);
        assertEquals(1, suggestions.size());
        ProductSuggestionDto item = suggestions.get(0);
        assertEquals("Cà phê Robusta Đắk Lắk", item.getProductName());
        assertEquals("180.000", item.getLatestCostPriceFormatted());
        assertEquals("250.000", item.getSuggestedSellingPriceFormatted());
        assertEquals("Đại lý Minh Hải", item.getLastSupplier());
    }
}
