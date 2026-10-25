package com.srbms.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "expense_transactions", indexes = {
    @Index(name = "idx_exp_tx_user_id", columnList = "user_id"),
    @Index(name = "idx_exp_tx_date", columnList = "transaction_date"),
    @Index(name = "idx_exp_tx_status", columnList = "payment_status"),
    @Index(name = "idx_exp_tx_product", columnList = "product_name")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpenseTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "transaction_date", nullable = false)
    private LocalDate transactionDate;

    // Tên nhà cung cấp / đối tác phân phối / người bán
    @Column(name = "supplier_name", nullable = false, length = 255)
    private String supplierName;

    // Tên hàng hóa nhập vào
    @Column(name = "product_name", nullable = false, length = 255)
    private String productName;

    // Loại chi phí: HANG_HOA (Hàng hóa), NGUYEN_VAT_LIEU, BAO_BI, KHAC
    @Column(name = "category", length = 100)
    @Builder.Default
    private String category = "HANG_HOA";

    // Đơn vị tính: kg, cái, hộp, thùng, gói, lon...
    @Column(name = "unit", length = 50)
    @Builder.Default
    private String unit = "cái";

    // Số lượng hàng hóa nhập vào
    @Column(name = "quantity", nullable = false)
    @Builder.Default
    private Integer quantity = 1;

    // Đơn giá nhập hàng
    @Column(name = "unit_price", nullable = false, precision = 15, scale = 2)
    private BigDecimal unitPrice;

    // Thành tiền = quantity * unitPrice
    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    // Giá bán gợi ý cho phần Doanh thu (nếu có xác định trước)
    @Column(name = "suggested_selling_price", precision = 15, scale = 2)
    private BigDecimal suggestedSellingPrice;

    // TIEN_MAT (Tiền mặt), CHUYEN_KHOAN (Chuyển khoản)
    @Column(name = "payment_method", nullable = false, length = 50)
    @Builder.Default
    private String paymentMethod = "TIEN_MAT";

    // DA_THANH_TOAN (Đã thanh toán), CHUA_THANH_TOAN (Chưa thanh toán / nợ)
    @Column(name = "payment_status", nullable = false, length = 50)
    @Builder.Default
    private String paymentStatus = "DA_THANH_TOAN";

    @Column(name = "note", length = 500)
    private String note;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
