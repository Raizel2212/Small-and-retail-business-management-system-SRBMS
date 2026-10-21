package com.srbms.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "household_businesses", indexes = {
    @Index(name = "idx_household_businesses_user_id", columnList = "user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HouseholdBusiness {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "business_name", length = 255)
    private String businessName;

    // Nhóm 1, 2, 3, 4
    @Column(name = "business_group", nullable = false)
    private Integer businessGroup;

    // Khoảng doanh thu: "Dưới 1 tỷ", "Từ 1 đến 3 tỷ", "Từ 4 tỷ đến 50 tỷ", "Từ 50 tỷ trở lên"
    @Column(name = "revenue_range", nullable = false, length = 100)
    private String revenueRange;

    // Loại hình: "Bán lẻ", "Ăn uống", "Dịch vụ", "Sản xuất", "Xây dựng & Vận tải", "Khác"
    @Column(name = "business_type", nullable = false, length = 100)
    private String businessType;

    // Mô tả chi tiết khi chọn loại hình "Khác"
    @Column(name = "other_business_type", length = 255)
    private String otherBusinessType;

    // Mã số thuế của hộ kinh doanh (dùng mở rộng sau này)
    @Column(name = "tax_code", length = 30)
    private String taxCode;

    // Địa chỉ đăng ký kinh doanh
    @Column(name = "address", length = 500)
    private String address;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
