package com.srbms.service;

import com.srbms.dto.UserDto;
import com.srbms.dto.request.BusinessProfileRequest;

public interface UserService {

    UserDto updateBusinessProfile(String cccd, BusinessProfileRequest request);

    UserDto getCurrentUser(String cccd);
}
