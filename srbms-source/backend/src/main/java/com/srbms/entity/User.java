package com.srbms.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_users_cccd", columnList = "cccd", unique = true),
    @Index(name = "idx_users_email", columnList = "email", unique = true),
    @Index(name = "idx_users_sdt", columnList = "sdt", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 12)
    private String cccd;

    @Column(nullable = false)
    private String password;

    @Column(length = 50)
    private String username;

    @Column(nullable = false, length = 100)
    private String fullName;

    @Column(nullable = false, unique = true, length = 15)
    private String sdt;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    private LocalDate dateOfBirth;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String role = "ROLE_USER";

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "ACTIVE";

    @Column(nullable = false)
    @Builder.Default
    private Boolean isFirstLogin = true;

    @Column(name = "business_group")
    private Integer businessGroup;

    @Column(name = "business_type", length = 100)
    private String businessType;

    @Column(name = "other_business_type", length = 255)
    private String otherBusinessType;

    @Column(name = "business_name", length = 255)
    private String businessName;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
