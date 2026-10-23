package com.srbms.controller;

import com.srbms.dto.response.ApiResponse;
import com.srbms.dto.response.BusinessConfigResponse;
import com.srbms.dto.response.BusinessGroupDto;
import com.srbms.dto.response.BusinessTypeDto;
import com.srbms.service.BusinessConfigService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/business-config")
public class BusinessConfigController {

    private final BusinessConfigService businessConfigService;

    public BusinessConfigController(BusinessConfigService businessConfigService) {
        this.businessConfigService = businessConfigService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<BusinessConfigResponse>> getConfiguration() {
        BusinessConfigResponse config = businessConfigService.getBusinessConfiguration();
        return ResponseEntity.ok(ApiResponse.ok("Lấy cấu hình hộ kinh doanh thành công", config));
    }

    @GetMapping("/groups")
    public ResponseEntity<ApiResponse<List<BusinessGroupDto>>> getGroups() {
        List<BusinessGroupDto> groups = businessConfigService.getBusinessGroups();
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách nhóm hộ kinh doanh thành công", groups));
    }

    @GetMapping("/types")
    public ResponseEntity<ApiResponse<List<BusinessTypeDto>>> getTypes() {
        List<BusinessTypeDto> types = businessConfigService.getBusinessTypes();
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách loại hình kinh doanh thành công", types));
    }
}
