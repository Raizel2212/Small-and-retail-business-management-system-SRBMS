package com.srbms.service.impl;

import com.srbms.dto.response.BusinessConfigResponse;
import com.srbms.dto.response.BusinessGroupDto;
import com.srbms.dto.response.BusinessTypeDto;
import com.srbms.enums.BusinessCategory;
import com.srbms.enums.BusinessGroup;
import com.srbms.service.BusinessConfigService;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BusinessConfigServiceImpl implements BusinessConfigService {

    @Override
    public BusinessConfigResponse getBusinessConfiguration() {
        return BusinessConfigResponse.builder()
                .groups(getBusinessGroups())
                .businessTypes(getBusinessTypes())
                .build();
    }

    @Override
    public List<BusinessGroupDto> getBusinessGroups() {
        return Arrays.stream(BusinessGroup.values())
                .map(bg -> BusinessGroupDto.builder()
                        .group(bg.getGroupNumber())
                        .name(bg.getName())
                        .title(bg.getTitle())
                        .revenueRange(bg.getRevenueRange())
                        .minRevenue(bg.getMinRevenue())
                        .maxRevenue(bg.getMaxRevenue())
                        .description(bg.getDescription())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public List<BusinessTypeDto> getBusinessTypes() {
        return Arrays.stream(BusinessCategory.values())
                .map(cat -> BusinessTypeDto.builder()
                        .code(cat.getCode())
                        .label(cat.getLabel())
                        .description(cat.getDescription())
                        .requiresCustomInput(cat.isRequiresCustomInput())
                        .build())
                .collect(Collectors.toList());
    }
}
