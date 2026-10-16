import { apiClient } from './client';
import {
  ApiResponse,
  AuthData,
  LoginRequest,
  RegisterRequest,
} from '../types/auth';

export const authApi = {
  /**
   * Đăng nhập người dùng bằng CCCD và Mật khẩu
   * Endpoint: POST /api/v1/auth/login
   */
  async login(payload: LoginRequest): Promise<ApiResponse<AuthData>> {
    const response = await apiClient.post<ApiResponse<AuthData>>(
      '/api/v1/auth/login',
      {
        cccd: payload.cccd.trim(),
        password: payload.password,
      }
    );
    return response.data;
  },

  /**
   * Đăng ký tài khoản người dùng mới
   * Endpoint: POST /api/v1/auth/register
   */
  async register(payload: RegisterRequest): Promise<ApiResponse<void>> {
    const body: Record<string, any> = {
      cccd: payload.cccd.trim(),
      password: payload.password,
      fullName: payload.fullName.trim(),
      sdt: payload.sdt.trim(),
      email: payload.email.trim(),
    };

    if (payload.username && payload.username.trim()) {
      body.username = payload.username.trim();
    }

    if (payload.dateOfBirth && payload.dateOfBirth.trim()) {
      body.dateOfBirth = payload.dateOfBirth.trim();
    }

    const response = await apiClient.post<ApiResponse<void>>(
      '/api/v1/auth/register',
      body
    );
    return response.data;
  },

  /**
   * Cập nhật thông tin chi tiết Hộ kinh doanh (Nhóm 1-3, Loại hình, Khác)
   * Endpoint: PUT /api/v1/user/business-profile
   */
  async updateBusinessProfile(payload: import('../types/auth').BusinessProfileRequest): Promise<ApiResponse<import('../types/auth').User>> {
    const response = await apiClient.put<ApiResponse<import('../types/auth').User>>(
      '/api/v1/user/business-profile',
      payload
    );
    return response.data;
  },

  /**
   * Lấy thông tin tài khoản và hộ kinh doanh hiện tại
   * Endpoint: GET /api/v1/user/me
   */
  async getMe(): Promise<ApiResponse<import('../types/auth').User>> {
    const response = await apiClient.get<ApiResponse<import('../types/auth').User>>(
      '/api/v1/user/me'
    );
    return response.data;
  },

  /**
   * Kiểm tra kết nối tới Server
   */
  async ping(): Promise<boolean> {
    try {
      await apiClient.get('/', { timeout: 3000 });
      return true;
    } catch (err: any) {
      // Nếu server trả về 404 hoặc 401 thì server vẫn sống (online)
      if (err.status) {
        return true;
      }
      return false;
    }
  },
};
