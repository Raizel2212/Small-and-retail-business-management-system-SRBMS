package com.srbms.service.impl;

import com.srbms.dto.request.CreateRevenueRequest;
import com.srbms.dto.response.RevenueItemDto;
import com.srbms.dto.response.RevenueSummaryResponse;
import com.srbms.entity.RevenueTransaction;
import com.srbms.entity.User;
import com.srbms.exception.AppException;
import com.srbms.repository.RevenueRepository;
import com.srbms.repository.UserRepository;
import com.srbms.service.RevenueService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import com.srbms.dto.response.ProductSuggestionDto;
import com.srbms.service.ExpenseService;

@Service
public class RevenueServiceImpl implements RevenueService {

    private final RevenueRepository revenueRepository;
    private final UserRepository userRepository;
    private final ExpenseService expenseService;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public RevenueServiceImpl(
            RevenueRepository revenueRepository,
            UserRepository userRepository,
            ExpenseService expenseService) {
        this.revenueRepository = revenueRepository;
        this.userRepository = userRepository;
        this.expenseService = expenseService;
    }

    @Override
    @Transactional
    public RevenueSummaryResponse getRevenueSummary(String cccd, String period, Integer year, Integer month, Integer quarter) {
        User user = getUserByCccd(cccd);

        // Khởi tạo dữ liệu mẫu lần đầu nếu người dùng chưa có giao dịch nào
        if (revenueRepository.countByUser(user) == 0) {
            seedSampleTransactions(user);
        }

        LocalDate now = LocalDate.now();
        int targetYear = (year != null && year > 2000) ? year : now.getYear();
        int targetMonth = (month != null && month >= 1 && month <= 12) ? month : now.getMonthValue();
        int targetQuarter = (quarter != null && quarter >= 1 && quarter <= 4) ? quarter : ((targetMonth - 1) / 3 + 1);

        String activePeriod = (period != null && !period.isBlank()) ? period.toLowerCase().trim() : "month";

        List<RevenueTransaction> transactions;
        String periodLabel;

        switch (activePeriod) {
            case "quarter":
                int startMonthOfQuarter = (targetQuarter - 1) * 3 + 1;
                LocalDate startQuarter = LocalDate.of(targetYear, startMonthOfQuarter, 1);
                LocalDate endQuarter = LocalDate.of(targetYear, startMonthOfQuarter + 2, 1);
                endQuarter = endQuarter.withDayOfMonth(endQuarter.lengthOfMonth());
                transactions = revenueRepository.findByUserAndTransactionDateBetweenOrderByTransactionDateDescIdDesc(
                        user, startQuarter, endQuarter);
                periodLabel = "Quý " + targetQuarter + "/" + targetYear;
                break;

            case "year":
                LocalDate startYear = LocalDate.of(targetYear, 1, 1);
                LocalDate endYear = LocalDate.of(targetYear, 12, 31);
                transactions = revenueRepository.findByUserAndTransactionDateBetweenOrderByTransactionDateDescIdDesc(
                        user, startYear, endYear);
                periodLabel = "Năm " + targetYear;
                break;

            case "all":
                transactions = revenueRepository.findByUserOrderByTransactionDateDescIdDesc(user);
                periodLabel = "Tất cả thời gian";
                break;

            case "month":
            default:
                LocalDate startMonth = LocalDate.of(targetYear, targetMonth, 1);
                LocalDate endMonth = startMonth.withDayOfMonth(startMonth.lengthOfMonth());
                transactions = revenueRepository.findByUserAndTransactionDateBetweenOrderByTransactionDateDescIdDesc(
                        user, startMonth, endMonth);
                periodLabel = "Tháng " + targetMonth + "/" + targetYear;
                break;
        }

        // Tính toán thống kê doanh thu
        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal totalCash = BigDecimal.ZERO;
        BigDecimal totalTransfer = BigDecimal.ZERO;
        BigDecimal totalUnpaid = BigDecimal.ZERO;

        List<RevenueItemDto> items = new ArrayList<>();
        int index = 1;
        for (RevenueTransaction tx : transactions) {
            BigDecimal amt = tx.getAmount() != null ? tx.getAmount() : BigDecimal.ZERO;
            totalRevenue = totalRevenue.add(amt);

            boolean isPaid = "DA_THU".equalsIgnoreCase(tx.getPaymentStatus());
            if (isPaid) {
                if ("CHUYEN_KHOAN".equalsIgnoreCase(tx.getPaymentMethod())) {
                    totalTransfer = totalTransfer.add(amt);
                } else {
                    totalCash = totalCash.add(amt);
                }
            } else {
                totalUnpaid = totalUnpaid.add(amt);
            }

            items.add(RevenueItemDto.builder()
                    .id(tx.getId())
                    .stt(index++)
                    .transactionDate(tx.getTransactionDate())
                    .transactionDateFormatted(tx.getTransactionDate() != null ? tx.getTransactionDate().format(DATE_FORMATTER) : "")
                    .customerName(tx.getCustomerName())
                    .amount(amt)
                    .amountFormatted(formatCurrency(amt))
                    .productName(tx.getProductName())
                    .quantity(tx.getQuantity() != null ? tx.getQuantity() : 0)
                    .unitPrice(tx.getUnitPrice())
                    .unitPriceFormatted(tx.getUnitPrice() != null ? formatCurrency(tx.getUnitPrice()) : null)
                    .isRetailCustomer(tx.getIsRetailCustomer() != null ? tx.getIsRetailCustomer() : "Khách lẻ".equalsIgnoreCase(tx.getCustomerName()))
                    .paymentMethod(tx.getPaymentMethod())
                    .paymentMethodLabel("CHUYEN_KHOAN".equalsIgnoreCase(tx.getPaymentMethod()) ? "Chuyển khoản" : "Tiền mặt")
                    .paymentStatus(tx.getPaymentStatus())
                    .paymentStatusLabel(isPaid ? "Đã thu tiền" : "Chưa thu tiền")
                    .isPaid(isPaid)
                    .note(tx.getNote())
                    .build());
        }

        return RevenueSummaryResponse.builder()
                .totalRevenue(totalRevenue)
                .totalRevenueFormatted(formatCurrency(totalRevenue))
                .totalCash(totalCash)
                .totalCashFormatted(formatCurrency(totalCash))
                .totalTransfer(totalTransfer)
                .totalTransferFormatted(totalTransfer.compareTo(BigDecimal.ZERO) == 0 ? "-" : formatCurrency(totalTransfer))
                .totalUnpaid(totalUnpaid)
                .totalUnpaidFormatted(totalUnpaid.compareTo(BigDecimal.ZERO) == 0 ? "0" : formatCurrency(totalUnpaid))
                .period(activePeriod)
                .periodLabel(periodLabel)
                .totalRecords(items.size())
                .items(items)
                .build();
    }

    @Override
    @Transactional
    public RevenueItemDto createRevenue(String cccd, CreateRevenueRequest request) {
        User user = getUserByCccd(cccd);

        LocalDate date = request.getTransactionDate() != null ? request.getTransactionDate() : LocalDate.now();
        String method = (request.getPaymentMethod() != null && "CHUYEN_KHOAN".equalsIgnoreCase(request.getPaymentMethod()))
                ? "CHUYEN_KHOAN" : "TIEN_MAT";
        String status = (request.getPaymentStatus() != null && "CHUA_THU".equalsIgnoreCase(request.getPaymentStatus()))
                ? "CHUA_THU" : "DA_THU";

        boolean isRetail = Boolean.TRUE.equals(request.getIsRetailCustomer()) || "Khách lẻ".equalsIgnoreCase(request.getCustomerName().trim());

        RevenueTransaction tx = RevenueTransaction.builder()
                .user(user)
                .transactionDate(date)
                .customerName(request.getCustomerName().trim())
                .amount(request.getAmount())
                .productName(request.getProductName() != null ? request.getProductName().trim() : null)
                .quantity(request.getQuantity() != null ? request.getQuantity() : 0)
                .unitPrice(request.getUnitPrice())
                .isRetailCustomer(isRetail)
                .paymentMethod(method)
                .paymentStatus(status)
                .note(request.getNote() != null ? request.getNote().trim() : null)
                .build();

        RevenueTransaction saved = revenueRepository.save(tx);
        boolean isPaid = "DA_THU".equalsIgnoreCase(saved.getPaymentStatus());

        return RevenueItemDto.builder()
                .id(saved.getId())
                .stt(1)
                .transactionDate(saved.getTransactionDate())
                .transactionDateFormatted(saved.getTransactionDate().format(DATE_FORMATTER))
                .customerName(saved.getCustomerName())
                .amount(saved.getAmount())
                .amountFormatted(formatCurrency(saved.getAmount()))
                .productName(saved.getProductName())
                .quantity(saved.getQuantity() != null ? saved.getQuantity() : 0)
                .unitPrice(saved.getUnitPrice())
                .unitPriceFormatted(saved.getUnitPrice() != null ? formatCurrency(saved.getUnitPrice()) : null)
                .isRetailCustomer(saved.getIsRetailCustomer())
                .paymentMethod(saved.getPaymentMethod())
                .paymentMethodLabel("CHUYEN_KHOAN".equalsIgnoreCase(saved.getPaymentMethod()) ? "Chuyển khoản" : "Tiền mặt")
                .paymentStatus(saved.getPaymentStatus())
                .paymentStatusLabel(isPaid ? "Đã thu tiền" : "Chưa thu tiền")
                .isPaid(isPaid)
                .note(saved.getNote())
                .build();
    }

    @Override
    @Transactional
    public RevenueItemDto togglePaymentStatus(String cccd, Long id) {
        User user = getUserByCccd(cccd);
        RevenueTransaction tx = revenueRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy khoản doanh thu"));

        if (!tx.getUser().getId().equals(user.getId())) {
            throw new AppException(HttpStatus.FORBIDDEN, "Bạn không có quyền thao tác trên khoản mục này");
        }

        if ("DA_THU".equalsIgnoreCase(tx.getPaymentStatus())) {
            tx.setPaymentStatus("CHUA_THU");
        } else {
            tx.setPaymentStatus("DA_THU");
        }

        RevenueTransaction saved = revenueRepository.save(tx);
        boolean isPaid = "DA_THU".equalsIgnoreCase(saved.getPaymentStatus());

        return RevenueItemDto.builder()
                .id(saved.getId())
                .stt(1)
                .transactionDate(saved.getTransactionDate())
                .transactionDateFormatted(saved.getTransactionDate().format(DATE_FORMATTER))
                .customerName(saved.getCustomerName())
                .amount(saved.getAmount())
                .amountFormatted(formatCurrency(saved.getAmount()))
                .productName(saved.getProductName())
                .quantity(saved.getQuantity() != null ? saved.getQuantity() : 0)
                .unitPrice(saved.getUnitPrice())
                .unitPriceFormatted(saved.getUnitPrice() != null ? formatCurrency(saved.getUnitPrice()) : null)
                .isRetailCustomer(saved.getIsRetailCustomer())
                .paymentMethod(saved.getPaymentMethod())
                .paymentMethodLabel("CHUYEN_KHOAN".equalsIgnoreCase(saved.getPaymentMethod()) ? "Chuyển khoản" : "Tiền mặt")
                .paymentStatus(saved.getPaymentStatus())
                .paymentStatusLabel(isPaid ? "Đã thu tiền" : "Chưa thu tiền")
                .isPaid(isPaid)
                .note(saved.getNote())
                .build();
    }

    @Override
    @Transactional
    public void deleteRevenue(String cccd, Long id) {
        User user = getUserByCccd(cccd);
        RevenueTransaction tx = revenueRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy khoản doanh thu"));

        if (!tx.getUser().getId().equals(user.getId())) {
            throw new AppException(HttpStatus.FORBIDDEN, "Bạn không có quyền xóa khoản mục này");
        }

        revenueRepository.delete(tx);
    }

    private User getUserByCccd(String cccd) {
        return userRepository.findByCccd(cccd)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản người dùng"));
    }

    private void seedSampleTransactions(User user) {
        LocalDate today = LocalDate.now();
        List<RevenueTransaction> samples = List.of(
                RevenueTransaction.builder()
                        .user(user)
                        .transactionDate(today)
                        .customerName("Nguyễn văn A")
                        .productName("Cà phê Robusta Đắk Lắk")
                        .quantity(4)
                        .unitPrice(new BigDecimal("250000"))
                        .amount(new BigDecimal("1000000"))
                        .isRetailCustomer(false)
                        .paymentMethod("TIEN_MAT")
                        .paymentStatus("DA_THU")
                        .note("Thanh toán tiền mặt tại quầy")
                        .build(),
                RevenueTransaction.builder()
                        .user(user)
                        .transactionDate(today)
                        .customerName("Phan tú Q")
                        .productName("Bột ngũ cốc dinh dưỡng")
                        .quantity(10)
                        .unitPrice(new BigDecimal("200000"))
                        .amount(new BigDecimal("2000000"))
                        .isRetailCustomer(false)
                        .paymentMethod("TIEN_MAT")
                        .paymentStatus("CHUA_THU")
                        .note("Giao hàng công nợ chưa thu")
                        .build(),
                RevenueTransaction.builder()
                        .user(user)
                        .transactionDate(today.minusDays(1))
                        .customerName("Trần Mai L")
                        .productName("Bộ ấm chén Bát Tràng")
                        .quantity(30)
                        .unitPrice(new BigDecimal("500000"))
                        .amount(new BigDecimal("15000000"))
                        .isRetailCustomer(false)
                        .paymentMethod("CHUYEN_KHOAN")
                        .paymentStatus("DA_THU")
                        .note("Chuyển khoản Vietcombank")
                        .build(),
                RevenueTransaction.builder()
                        .user(user)
                        .transactionDate(today.minusDays(2))
                        .customerName("Vũ Đình K")
                        .productName("Trà Thái Nguyên Thượng Hạng")
                        .quantity(40)
                        .unitPrice(new BigDecimal("300000"))
                        .amount(new BigDecimal("12000000"))
                        .isRetailCustomer(false)
                        .paymentMethod("CHUYEN_KHOAN")
                        .paymentStatus("DA_THU")
                        .note("Chuyển khoản MBBank đơn buôn sỉ")
                        .build()
        );
        revenueRepository.saveAll(samples);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductSuggestionDto> getProductSuggestions(String cccd, String keyword) {
        return expenseService.getProductSuggestions(cccd, keyword);
    }

    private String formatCurrency(BigDecimal amount) {
        if (amount == null) return "0";
        DecimalFormatSymbols symbols = new DecimalFormatSymbols(Locale.GERMANY);
        symbols.setGroupingSeparator('.');
        symbols.setDecimalSeparator(',');
        DecimalFormat df = new DecimalFormat("#,##0", symbols);
        return df.format(amount);
    }
}
