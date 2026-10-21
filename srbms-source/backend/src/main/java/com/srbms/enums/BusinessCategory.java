package com.srbms.enums;

import lombok.Getter;

@Getter
public enum BusinessCategory {
    BAN_LE(
            "BAN_LE",
            "Bán lẻ",
            "Cửa hàng bán lẻ, bách hóa, siêu thị mini, thời trang, phân phối tiêu dùng",
            false
    ),
    AN_UONG(
            "AN_UONG",
            "Ăn uống",
            "Nhà hàng, quán ăn, quán cà phê, tiệm bánh, trà sữa, ẩm thực giải khát",
            false
    ),
    DICH_VU(
            "DICH_VU",
            "Dịch vụ",
            "Làm đẹp, spa, sửa chữa, bảo dưỡng, lưu trú, giặt là, tư vấn dịch vụ",
            false
    ),
    SAN_XUAT(
            "SAN_XUAT",
            "Sản xuất",
            "Chế biến thực phẩm nông sản, gia công may mặc, tiểu thủ công nghiệp, mộc",
            false
    ),
    XAY_DUNG_VAN_TAI(
            "XAY_DUNG_VAN_TAI",
            "Xây dựng & Vận tải",
            "Thi công xây dựng, hoàn thiện, vận chuyển hàng hóa và dịch vụ logistics",
            false
    ),
    KHAC(
            "KHAC",
            "Khác",
            "Ngành nghề kinh doanh khác (Người dùng tự điền tên loại hình kinh doanh)",
            true
    );

    private final String code;
    private final String label;
    private final String description;
    private final boolean requiresCustomInput;

    BusinessCategory(String code, String label, String description, boolean requiresCustomInput) {
        this.code = code;
        this.label = label;
        this.description = description;
        this.requiresCustomInput = requiresCustomInput;
    }

    public static BusinessCategory fromCode(String code) {
        if (code == null) {
            return null;
        }
        for (BusinessCategory category : values()) {
            if (category.code.equalsIgnoreCase(code.trim()) || category.label.equalsIgnoreCase(code.trim())) {
                return category;
            }
        }
        return null;
    }
}
