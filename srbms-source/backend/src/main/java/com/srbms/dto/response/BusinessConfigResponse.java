package com.srbms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BusinessConfigResponse {
    private List<BusinessGroupDto> groups;
    private List<BusinessTypeDto> businessTypes;
}
