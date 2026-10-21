package com.srbms.service;

import com.srbms.dto.response.BusinessConfigResponse;
import com.srbms.dto.response.BusinessGroupDto;
import com.srbms.dto.response.BusinessTypeDto;

import java.util.List;

public interface BusinessConfigService {

    BusinessConfigResponse getBusinessConfiguration();

    List<BusinessGroupDto> getBusinessGroups();

    List<BusinessTypeDto> getBusinessTypes();
}
