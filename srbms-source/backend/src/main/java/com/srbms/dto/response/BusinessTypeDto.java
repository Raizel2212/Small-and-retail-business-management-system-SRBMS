package com.srbms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BusinessTypeDto {
    private String code;
    private String label;
    private String description;
    private Boolean requiresCustomInput;
}
