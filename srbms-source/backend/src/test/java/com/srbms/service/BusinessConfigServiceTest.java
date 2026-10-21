package com.srbms.service;

import com.srbms.dto.response.BusinessConfigResponse;
import com.srbms.dto.response.BusinessGroupDto;
import com.srbms.dto.response.BusinessTypeDto;
import com.srbms.service.impl.BusinessConfigServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class BusinessConfigServiceTest {

    private BusinessConfigService businessConfigService;

    @BeforeEach
    void setUp() {
        businessConfigService = new BusinessConfigServiceImpl();
    }

    @Test
    @DisplayName("Lấy danh sách nhóm hộ kinh doanh phải có đủ 4 nhóm theo đúng mức doanh thu quy định")
    void testGetBusinessGroups_HasFourGroupsWithCorrectRevenues() {
        List<BusinessGroupDto> groups = businessConfigService.getBusinessGroups();

        assertNotNull(groups);
        assertEquals(4, groups.size());

        // Nhóm 1: dưới 1 tỷ
        BusinessGroupDto group1 = groups.get(0);
        assertEquals(1, group1.getGroup());
        assertEquals("Dưới 1 tỷ", group1.getRevenueRange());
        assertEquals(0L, group1.getMinRevenue());
        assertEquals(1_000_000_000L, group1.getMaxRevenue());

        // Nhóm 2: từ 1 đến 3 tỷ
        BusinessGroupDto group2 = groups.get(1);
        assertEquals(2, group2.getGroup());
        assertEquals("Từ 1 đến 3 tỷ", group2.getRevenueRange());
        assertEquals(1_000_000_000L, group2.getMinRevenue());
        assertEquals(3_000_000_000L, group2.getMaxRevenue());

        // Nhóm 3: từ 4 tỷ đến 50 tỷ
        BusinessGroupDto group3 = groups.get(2);
        assertEquals(3, group3.getGroup());
        assertEquals("Từ 4 tỷ đến 50 tỷ", group3.getRevenueRange());
        assertEquals(4_000_000_000L, group3.getMinRevenue());
        assertEquals(50_000_000_000L, group3.getMaxRevenue());

        // Nhóm 4: từ 50 tỷ trở lên
        BusinessGroupDto group4 = groups.get(3);
        assertEquals(4, group4.getGroup());
        assertEquals("Từ 50 tỷ trở lên", group4.getRevenueRange());
        assertEquals(50_000_000_000L, group4.getMinRevenue());
        assertNull(group4.getMaxRevenue());
    }

    @Test
    @DisplayName("Lấy danh sách loại hình kinh doanh bao gồm Bán lẻ, Ăn uống, Dịch vụ và Khác")
    void testGetBusinessTypes_HasExpectedCategories() {
        List<BusinessTypeDto> types = businessConfigService.getBusinessTypes();

        assertNotNull(types);
        assertTrue(types.stream().anyMatch(t -> "BAN_LE".equals(t.getCode()) && "Bán lẻ".equals(t.getLabel())));
        assertTrue(types.stream().anyMatch(t -> "AN_UONG".equals(t.getCode()) && "Ăn uống".equals(t.getLabel())));
        assertTrue(types.stream().anyMatch(t -> "DICH_VU".equals(t.getCode()) && "Dịch vụ".equals(t.getLabel())));
        
        // Mục Khác phải yêu cầu nhập tùy chỉnh (requiresCustomInput = true)
        BusinessTypeDto otherType = types.stream()
                .filter(t -> "KHAC".equals(t.getCode()))
                .findFirst()
                .orElse(null);
        assertNotNull(otherType);
        assertEquals("Khác", otherType.getLabel());
        assertTrue(otherType.getRequiresCustomInput());
    }

    @Test
    @DisplayName("Lấy toàn bộ cấu hình hộ kinh doanh (gồm groups và businessTypes)")
    void testGetBusinessConfiguration() {
        BusinessConfigResponse response = businessConfigService.getBusinessConfiguration();

        assertNotNull(response);
        assertEquals(4, response.getGroups().size());
        assertFalse(response.getBusinessTypes().isEmpty());
    }
}
