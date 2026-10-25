package com.srbms.service.impl;

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
import com.srbms.service.ExpenseService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Service
public class ExpenseServiceImpl implements ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public ExpenseServiceImpl(
            ExpenseRepository expenseRepository,
            ProductRepository productRepository,
            UserRepository userRepository) {
        this.expenseRepository = expenseRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public ExpenseSummaryResponse getExpenseSummary(String cccd, String period, Integer year, Integer month, Integer quarter) {
        User user = getUserByCccd(cccd);

        // Khởi tạo dữ liệu mẫu lần đầu nếu người dùng chưa có giao dịch chi phí nào
        if (expenseRepository.countByUser(user) == 0) {
            seedSampleExpenses(user);
        }

        LocalDate now = LocalDate.now();
        int targetYear = (year != null && year > 2000) ? year : now.getYear();
        int targetMonth = (month != null && month >= 1 && month <= 12) ? month : now.getMonthValue();
        int targetQuarter = (quarter != null && quarter >= 1 && quarter <= 4) ? quarter : ((targetMonth - 1) / 3 + 1);

        String activePeriod = (period != null && !period.isBlank()) ? period.toLowerCase().trim() : "month";

        List<ExpenseTransaction> transactions;
        String periodLabel;

        switch (activePeriod) {
            case "quarter":
                int startMonthOfQuarter = (targetQuarter - 1) * 3 + 1;
                LocalDate startQuarter = LocalDate.of(targetYear, startMonthOfQuarter, 1);
                LocalDate endQuarter = LocalDate.of(targetYear, startMonthOfQuarter + 2, 1);
                endQuarter = endQuarter.withDayOfMonth(endQuarter.lengthOfMonth());
                transactions = expenseRepository.findByUserAndTransactionDateBetweenOrderByTransactionDateDescIdDesc(
                        user, startQuarter, endQuarter);
                periodLabel = "Quý " + targetQuarter + "/" + targetYear;
                break;

            case "year":
                LocalDate startYear = LocalDate.of(targetYear, 1, 1);
                LocalDate endYear = LocalDate.of(targetYear, 12, 31);
                transactions = expenseRepository.findByUserAndTransactionDateBetweenOrderByTransactionDateDescIdDesc(
                        user, startYear, endYear);
                periodLabel = "Năm " + targetYear;
                break;

            case "all":
                transactions = expenseRepository.findByUserOrderByTransactionDateDescIdDesc(user);
                periodLabel = "Tất cả thời gian";
                break;

            case "month":
            default:
                LocalDate startMonth = LocalDate.of(targetYear, targetMonth, 1);
                LocalDate endMonth = startMonth.withDayOfMonth(startMonth.lengthOfMonth());
                transactions = expenseRepository.findByUserAndTransactionDateBetweenOrderByTransactionDateDescIdDesc(
                        user, startMonth, endMonth);
                periodLabel = "Tháng " + targetMonth + "/" + targetYear;
                break;
        }

        // Tính toán tổng kết chi phí
        BigDecimal totalExpense = BigDecimal.ZERO;
        BigDecimal totalCash = BigDecimal.ZERO;
        BigDecimal totalTransfer = BigDecimal.ZERO;
        BigDecimal totalUnpaid = BigDecimal.ZERO;
        int totalQuantity = 0;

        List<ExpenseItemDto> items = new ArrayList<>();
        int index = 1;
        for (ExpenseTransaction tx : transactions) {
            BigDecimal amt = tx.getAmount() != null ? tx.getAmount() : BigDecimal.ZERO;
            totalExpense = totalExpense.add(amt);

            int qty = tx.getQuantity() != null ? tx.getQuantity() : 0;
            totalQuantity += qty;

            boolean isPaid = "DA_THANH_TOAN".equalsIgnoreCase(tx.getPaymentStatus()) || "DA_CHI".equalsIgnoreCase(tx.getPaymentStatus());
            if (isPaid) {
                if ("CHUYEN_KHOAN".equalsIgnoreCase(tx.getPaymentMethod())) {
                    totalTransfer = totalTransfer.add(amt);
                } else {
                    totalCash = totalCash.add(amt);
                }
            } else {
                totalUnpaid = totalUnpaid.add(amt);
            }

            items.add(mapToDto(tx, index++));
        }

        return ExpenseSummaryResponse.builder()
                .totalExpense(totalExpense)
                .totalExpenseFormatted(formatCurrency(totalExpense))
                .totalCash(totalCash)
                .totalCashFormatted(formatCurrency(totalCash))
                .totalTransfer(totalTransfer)
                .totalTransferFormatted(totalTransfer.compareTo(BigDecimal.ZERO) == 0 ? "-" : formatCurrency(totalTransfer))
                .totalUnpaid(totalUnpaid)
                .totalUnpaidFormatted(totalUnpaid.compareTo(BigDecimal.ZERO) == 0 ? "0" : formatCurrency(totalUnpaid))
                .totalQuantity(totalQuantity)
                .period(activePeriod)
                .periodLabel(periodLabel)
                .totalRecords(items.size())
                .items(items)
                .build();
    }

    @Override
    @Transactional
    public ExpenseItemDto createExpense(String cccd, CreateExpenseRequest request) {
        User user = getUserByCccd(cccd);

        LocalDate date = request.getTransactionDate() != null ? request.getTransactionDate() : LocalDate.now();
        int quantity = (request.getQuantity() != null && request.getQuantity() > 0) ? request.getQuantity() : 1;
        BigDecimal unitPrice = request.getUnitPrice() != null ? request.getUnitPrice() : BigDecimal.ZERO;

        // Tự động tính thành tiền nếu client chưa tính
        BigDecimal amount = (request.getAmount() != null && request.getAmount().compareTo(BigDecimal.ZERO) > 0)
                ? request.getAmount()
                : unitPrice.multiply(BigDecimal.valueOf(quantity));

        // Giá bán gợi ý cho phần Doanh thu
        BigDecimal suggestedSellingPrice = request.getSuggestedSellingPrice();
        if (suggestedSellingPrice == null || suggestedSellingPrice.compareTo(BigDecimal.ZERO) <= 0) {
            // Mặc định gợi ý giá bán = giá vốn + 25% biên lợi nhuận làm tròn hàng nghìn, hoặc tối thiểu bằng giá nhập
            suggestedSellingPrice = unitPrice.multiply(new BigDecimal("1.25")).setScale(-3, RoundingMode.HALF_UP);
            if (suggestedSellingPrice.compareTo(unitPrice) < 0) {
                suggestedSellingPrice = unitPrice;
            }
        }

        String unit = (request.getUnit() != null && !request.getUnit().isBlank()) ? request.getUnit().trim() : "cái";
        String category = (request.getCategory() != null && !request.getCategory().isBlank()) ? request.getCategory().trim() : "HANG_HOA";
        String method = (request.getPaymentMethod() != null && "CHUYEN_KHOAN".equalsIgnoreCase(request.getPaymentMethod()))
                ? "CHUYEN_KHOAN" : "TIEN_MAT";
        String status = (request.getPaymentStatus() != null &&
                ("CHUA_THANH_TOAN".equalsIgnoreCase(request.getPaymentStatus()) || "CHUA_CHI".equalsIgnoreCase(request.getPaymentStatus())))
                ? "CHUA_THANH_TOAN" : "DA_THANH_TOAN";

        ExpenseTransaction tx = ExpenseTransaction.builder()
                .user(user)
                .transactionDate(date)
                .supplierName(request.getSupplierName().trim())
                .productName(request.getProductName().trim())
                .category(category)
                .unit(unit)
                .quantity(quantity)
                .unitPrice(unitPrice)
                .amount(amount)
                .suggestedSellingPrice(suggestedSellingPrice)
                .paymentMethod(method)
                .paymentStatus(status)
                .note(request.getNote() != null ? request.getNote().trim() : null)
                .build();

        ExpenseTransaction saved = expenseRepository.save(tx);

        // Đồng bộ sản phẩm nhập vào danh mục gợi ý Doanh thu
        upsertProductCatalog(user, saved);

        return mapToDto(saved, 1);
    }

    @Override
    @Transactional
    public ExpenseItemDto updateExpense(String cccd, Long id, UpdateExpenseRequest request) {
        User user = getUserByCccd(cccd);
        ExpenseTransaction tx = expenseRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy khoản chi phí nhập hàng"));

        if (!tx.getUser().getId().equals(user.getId())) {
            throw new AppException(HttpStatus.FORBIDDEN, "Bạn không có quyền thao tác trên khoản mục này");
        }

        if (request.getTransactionDate() != null) {
            tx.setTransactionDate(request.getTransactionDate());
        }
        if (request.getSupplierName() != null && !request.getSupplierName().isBlank()) {
            tx.setSupplierName(request.getSupplierName().trim());
        }
        if (request.getProductName() != null && !request.getProductName().isBlank()) {
            tx.setProductName(request.getProductName().trim());
        }
        if (request.getUnit() != null && !request.getUnit().isBlank()) {
            tx.setUnit(request.getUnit().trim());
        }
        if (request.getCategory() != null && !request.getCategory().isBlank()) {
            tx.setCategory(request.getCategory().trim());
        }
        if (request.getQuantity() != null && request.getQuantity() > 0) {
            tx.setQuantity(request.getQuantity());
        }
        if (request.getUnitPrice() != null) {
            tx.setUnitPrice(request.getUnitPrice());
        }

        // Cập nhật thành tiền
        if (request.getAmount() != null && request.getAmount().compareTo(BigDecimal.ZERO) > 0) {
            tx.setAmount(request.getAmount());
        } else {
            tx.setAmount(tx.getUnitPrice().multiply(BigDecimal.valueOf(tx.getQuantity())));
        }

        if (request.getSuggestedSellingPrice() != null) {
            tx.setSuggestedSellingPrice(request.getSuggestedSellingPrice());
        }

        if (request.getPaymentMethod() != null) {
            tx.setPaymentMethod("CHUYEN_KHOAN".equalsIgnoreCase(request.getPaymentMethod()) ? "CHUYEN_KHOAN" : "TIEN_MAT");
        }
        if (request.getPaymentStatus() != null) {
            tx.setPaymentStatus(("CHUA_THANH_TOAN".equalsIgnoreCase(request.getPaymentStatus()) || "CHUA_CHI".equalsIgnoreCase(request.getPaymentStatus()))
                    ? "CHUA_THANH_TOAN" : "DA_THANH_TOAN");
        }
        if (request.getNote() != null) {
            tx.setNote(request.getNote().trim());
        }

        ExpenseTransaction updated = expenseRepository.save(tx);
        upsertProductCatalog(user, updated);

        return mapToDto(updated, 1);
    }

    @Override
    @Transactional
    public ExpenseItemDto togglePaymentStatus(String cccd, Long id) {
        User user = getUserByCccd(cccd);
        ExpenseTransaction tx = expenseRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy khoản chi phí nhập hàng"));

        if (!tx.getUser().getId().equals(user.getId())) {
            throw new AppException(HttpStatus.FORBIDDEN, "Bạn không có quyền thao tác trên khoản mục này");
        }

        boolean isPaid = "DA_THANH_TOAN".equalsIgnoreCase(tx.getPaymentStatus()) || "DA_CHI".equalsIgnoreCase(tx.getPaymentStatus());
        if (isPaid) {
            tx.setPaymentStatus("CHUA_THANH_TOAN");
        } else {
            tx.setPaymentStatus("DA_THANH_TOAN");
        }

        ExpenseTransaction saved = expenseRepository.save(tx);
        return mapToDto(saved, 1);
    }

    @Override
    @Transactional
    public void deleteExpense(String cccd, Long id) {
        User user = getUserByCccd(cccd);
        ExpenseTransaction tx = expenseRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy khoản chi phí nhập hàng"));

        if (!tx.getUser().getId().equals(user.getId())) {
            throw new AppException(HttpStatus.FORBIDDEN, "Bạn không có quyền xóa khoản mục này");
        }

        expenseRepository.delete(tx);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductSuggestionDto> getProductSuggestions(String cccd, String keyword) {
        User user = getUserByCccd(cccd);

        List<Product> products;
        if (keyword != null && !keyword.isBlank()) {
            products = productRepository.findByUserAndNameContainingIgnoreCaseOrderByNameAsc(user, keyword.trim());
        } else {
            products = productRepository.findByUserOrderByNameAsc(user);
        }

        List<ProductSuggestionDto> result = new ArrayList<>();
        for (Product p : products) {
            result.add(ProductSuggestionDto.builder()
                    .id(p.getId())
                    .productCode(p.getProductCode())
                    .productName(p.getName())
                    .unit(p.getUnit())
                    .category(p.getCategory())
                    .latestCostPrice(p.getLatestCostPrice())
                    .latestCostPriceFormatted(p.getLatestCostPrice() != null ? formatCurrency(p.getLatestCostPrice()) : null)
                    .suggestedSellingPrice(p.getSuggestedSellingPrice())
                    .suggestedSellingPriceFormatted(p.getSuggestedSellingPrice() != null ? formatCurrency(p.getSuggestedSellingPrice()) : null)
                    .totalImportedQuantity(p.getTotalImportedQuantity())
                    .lastImportDate(p.getLastImportDate())
                    .lastImportDateFormatted(p.getLastImportDate() != null ? p.getLastImportDate().format(DATE_FORMATTER) : null)
                    .lastSupplier(p.getLastSupplier())
                    .build());
        }
        return result;
    }

    private void upsertProductCatalog(User user, ExpenseTransaction expense) {
        Optional<Product> existingOpt = productRepository.findByUserAndNameIgnoreCase(user, expense.getProductName().trim());
        Product product;
        if (existingOpt.isPresent()) {
            product = existingOpt.get();
            product.setLatestCostPrice(expense.getUnitPrice());
            if (expense.getSuggestedSellingPrice() != null && expense.getSuggestedSellingPrice().compareTo(BigDecimal.ZERO) > 0) {
                product.setSuggestedSellingPrice(expense.getSuggestedSellingPrice());
            }
            if (expense.getUnit() != null && !expense.getUnit().isBlank()) {
                product.setUnit(expense.getUnit());
            }
            int currentQty = product.getTotalImportedQuantity() != null ? product.getTotalImportedQuantity() : 0;
            product.setTotalImportedQuantity(currentQty + (expense.getQuantity() != null ? expense.getQuantity() : 0));
            product.setLastImportDate(expense.getTransactionDate());
            product.setLastSupplier(expense.getSupplierName());
        } else {
            long count = productRepository.count();
            String code = String.format("SP%02d", count + 1);
            product = Product.builder()
                    .user(user)
                    .productCode(code)
                    .name(expense.getProductName().trim())
                    .unit(expense.getUnit())
                    .category(expense.getCategory())
                    .latestCostPrice(expense.getUnitPrice())
                    .suggestedSellingPrice(expense.getSuggestedSellingPrice())
                    .totalImportedQuantity(expense.getQuantity())
                    .lastImportDate(expense.getTransactionDate())
                    .lastSupplier(expense.getSupplierName())
                    .build();
        }
        productRepository.save(product);
    }

    private ExpenseItemDto mapToDto(ExpenseTransaction tx, int index) {
        boolean isPaid = "DA_THANH_TOAN".equalsIgnoreCase(tx.getPaymentStatus()) || "DA_CHI".equalsIgnoreCase(tx.getPaymentStatus());
        BigDecimal amt = tx.getAmount() != null ? tx.getAmount() : BigDecimal.ZERO;
        BigDecimal price = tx.getUnitPrice() != null ? tx.getUnitPrice() : BigDecimal.ZERO;

        return ExpenseItemDto.builder()
                .id(tx.getId())
                .stt(index)
                .transactionDate(tx.getTransactionDate())
                .transactionDateFormatted(tx.getTransactionDate() != null ? tx.getTransactionDate().format(DATE_FORMATTER) : "")
                .supplierName(tx.getSupplierName())
                .productName(tx.getProductName())
                .category(tx.getCategory())
                .categoryLabel(getCategoryLabel(tx.getCategory()))
                .unit(tx.getUnit() != null ? tx.getUnit() : "cái")
                .quantity(tx.getQuantity() != null ? tx.getQuantity() : 0)
                .unitPrice(price)
                .unitPriceFormatted(formatCurrency(price))
                .amount(amt)
                .amountFormatted(formatCurrency(amt))
                .suggestedSellingPrice(tx.getSuggestedSellingPrice())
                .suggestedSellingPriceFormatted(tx.getSuggestedSellingPrice() != null ? formatCurrency(tx.getSuggestedSellingPrice()) : null)
                .paymentMethod(tx.getPaymentMethod())
                .paymentMethodLabel("CHUYEN_KHOAN".equalsIgnoreCase(tx.getPaymentMethod()) ? "Chuyển khoản" : "Tiền mặt")
                .paymentStatus(tx.getPaymentStatus())
                .paymentStatusLabel(isPaid ? "Đã thanh toán" : "Chưa thanh toán")
                .isPaid(isPaid)
                .note(tx.getNote())
                .build();
    }

    private String getCategoryLabel(String category) {
        if (category == null) return "Hàng hóa nhập bán";
        return switch (category.toUpperCase()) {
            case "NGUYEN_VAT_LIEU" -> "Nguyên vật liệu";
            case "BAO_BI" -> "Bao bì đóng gói";
            case "DICH_VU" -> "Dịch vụ mua ngoài";
            case "KHAC" -> "Chi phí khác";
            default -> "Hàng hóa nhập bán";
        };
    }

    private User getUserByCccd(String cccd) {
        return userRepository.findByCccd(cccd)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản người dùng"));
    }

    private void seedSampleExpenses(User user) {
        LocalDate today = LocalDate.now();

        List<ExpenseTransaction> samples = List.of(
                ExpenseTransaction.builder()
                        .user(user)
                        .transactionDate(today)
                        .supplierName("Đại lý phân phối cà phê Minh Hải")
                        .productName("Cà phê Robusta Đắk Lắk")
                        .category("HANG_HOA")
                        .unit("kg")
                        .quantity(20)
                        .unitPrice(new BigDecimal("180000"))
                        .amount(new BigDecimal("3600000"))
                        .suggestedSellingPrice(new BigDecimal("250000"))
                        .paymentMethod("TIEN_MAT")
                        .paymentStatus("DA_THANH_TOAN")
                        .note("Nhập hạt cà phê Robusta rang mộc Đắk Lắk")
                        .build(),

                ExpenseTransaction.builder()
                        .user(user)
                        .transactionDate(today)
                        .supplierName("Công ty TNHH Thực phẩm Xanh Sài Gòn")
                        .productName("Bột ngũ cốc dinh dưỡng")
                        .category("HANG_HOA")
                        .unit("hộp")
                        .quantity(30)
                        .unitPrice(new BigDecimal("140000"))
                        .amount(new BigDecimal("4200000"))
                        .suggestedSellingPrice(new BigDecimal("200000"))
                        .paymentMethod("TIEN_MAT")
                        .paymentStatus("CHUA_THANH_TOAN")
                        .note("Giao hàng công nợ thanh toán cuối tháng")
                        .build(),

                ExpenseTransaction.builder()
                        .user(user)
                        .transactionDate(today.minusDays(1))
                        .supplierName("Xưởng gốm sứ thủ công Bát Tràng")
                        .productName("Bộ ấm chén Bát Tràng")
                        .category("HANG_HOA")
                        .unit("bộ")
                        .quantity(50)
                        .unitPrice(new BigDecimal("350000"))
                        .amount(new BigDecimal("17500000"))
                        .suggestedSellingPrice(new BigDecimal("500000"))
                        .paymentMethod("CHUYEN_KHOAN")
                        .paymentStatus("DA_THANH_TOAN")
                        .note("Chuyển khoản thanh toán lô hàng ấm chén cao cấp")
                        .build(),

                ExpenseTransaction.builder()
                        .user(user)
                        .transactionDate(today.minusDays(2))
                        .supplierName("Hợp tác xã Trà Tân Cương Thái Nguyên")
                        .productName("Trà Thái Nguyên Thượng Hạng")
                        .category("HANG_HOA")
                        .unit("gói")
                        .quantity(60)
                        .unitPrice(new BigDecimal("200000"))
                        .amount(new BigDecimal("12000000"))
                        .suggestedSellingPrice(new BigDecimal("300000"))
                        .paymentMethod("CHUYEN_KHOAN")
                        .paymentStatus("DA_THANH_TOAN")
                        .note("Nhập trà búp đinh thượng hạng vụ thu")
                        .build()
        );

        List<ExpenseTransaction> saved = expenseRepository.saveAll(samples);
        for (ExpenseTransaction tx : saved) {
            upsertProductCatalog(user, tx);
        }
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
