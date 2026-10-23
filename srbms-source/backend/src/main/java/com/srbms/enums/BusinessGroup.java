package com.srbms.enums;

import lombok.Getter;

@Getter
public enum BusinessGroup {
    GROUP_1(
            1,
            "Nhóm 1",
            "Hộ kinh doanh Nhóm 1",
            "Dưới 1 tỷ",
            0L,
            1_000_000_000L,
            "Doanh thu dưới 1 tỷ VNĐ/năm"
    ),
    GROUP_2(
            2,
            "Nhóm 2",
            "Hộ kinh doanh Nhóm 2",
            "Từ 1 đến 3 tỷ",
            1_000_000_000L,
            3_000_000_000L,
            "Doanh thu từ 1 tỷ đến 3 tỷ VNĐ/năm"
    ),
    GROUP_3(
            3,
            "Nhóm 3",
            "Hộ kinh doanh Nhóm 3",
            "Từ 4 tỷ đến 50 tỷ",
            4_000_000_000L,
            50_000_000_000L,
            "Doanh thu từ 4 tỷ đến 50 tỷ VNĐ/năm"
    ),
    GROUP_4(
            4,
            "Nhóm 4",
            "Hộ kinh doanh Nhóm 4",
            "Từ 50 tỷ trở lên",
            50_000_000_000L,
            null,
            "Doanh thu từ 50 tỷ VNĐ/năm trở lên"
    );

    private final int groupNumber;
    private final String name;
    private final String title;
    private final String revenueRange;
    private final Long minRevenue;
    private final Long maxRevenue;
    private final String description;

    BusinessGroup(int groupNumber, String name, String title, String revenueRange, Long minRevenue, Long maxRevenue, String description) {
        this.groupNumber = groupNumber;
        this.name = name;
        this.title = title;
        this.revenueRange = revenueRange;
        this.minRevenue = minRevenue;
        this.maxRevenue = maxRevenue;
        this.description = description;
    }

    public static BusinessGroup fromGroupNumber(Integer number) {
        if (number == null) {
            return null;
        }
        for (BusinessGroup bg : values()) {
            if (bg.groupNumber == number) {
                return bg;
            }
        }
        return null;
    }
}
