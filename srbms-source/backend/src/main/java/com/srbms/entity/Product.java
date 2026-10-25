package com.srbms.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "products", indexes = {
    @Index(name = "idx_products_user_id", columnList = "user_id"),
    @Index(name = "idx_products_name", columnList = "name")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "product_code", length = 50)
    private String productCode;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "unit", length = 50)
    @Builder.Default
    private String unit = "cái";

    @Column(name = "category", length = 100)
    @Builder.Default
    private String category = "HANG_HOA";

    // Giá vốn / Đơn giá nhập gần nhất từ phần Chi phí nhập hàng
    @Column(name = "latest_cost_price", precision = 15, scale = 2)
    private BigDecimal latestCostPrice;

    // Giá bán gợi ý cho phần Doanh thu
    @Column(name = "suggested_selling_price", precision = 15, scale = 2)
    private BigDecimal suggestedSellingPrice;

    // Tổng số lượng đã nhập từ các đợt chi phí
    @Column(name = "total_imported_quantity")
    @Builder.Default
    private Integer totalImportedQuantity = 0;

    // Ngày nhập gần nhất
    @Column(name = "last_import_date")
    private LocalDate lastImportDate;

    // Nhà cung cấp gần nhất
    @Column(name = "last_supplier", length = 255)
    private String lastSupplier;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
