package com.srbms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BusinessGroupDto {
    private Integer group;
    private String name;
    private String title;
    private String revenueRange;
    private Long minRevenue;
    private Long maxRevenue;
    private String description;
}
