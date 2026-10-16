import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStoredBaseUrl } from './config';

export const TOKEN_STORAGE_KEY = '@srbms_access_token';
export const USER_STORAGE_KEY = '@srbms_current_user';

export const apiClient = axios.create({
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor: Gắn baseURL động và JWT Bearer Token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // 1. Cập nhật baseURL theo thiết lập hiện thời
    const currentBaseUrl = await getStoredBaseUrl();
    config.baseURL = currentBaseUrl;

    // 2. Lấy JWT Token từ storage nếu có
    const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Chuẩn hóa dữ liệu và trích xuất thông điệp lỗi từ Backend
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<any>) => {
    if (error.response) {
      // Backend phản hồi lỗi HTTP (400, 401, 403, 409, 500, ...)
      const data = error.response.data;
      let friendlyMessage = data?.message;

      // Xử lý khi lỗi validate từ Spring Boot MethodArgumentNotValidException
      if (!friendlyMessage && data?.errors) {
        if (typeof data.errors === 'object') {
          friendlyMessage = Object.values(data.errors).join(', ');
        }
      }

      if (!friendlyMessage) {
        switch (error.response.status) {
          case 400:
            friendlyMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.';
            break;
          case 401:
            friendlyMessage = 'Số CCCD hoặc mật khẩu không chính xác.';
            break;
          case 403:
            friendlyMessage = 'Tài khoản không có quyền truy cập hoặc đã bị khóa.';
            break;
          case 404:
            friendlyMessage = 'Không tìm thấy tài nguyên yêu cầu (404).';
            break;
          case 409:
            friendlyMessage = 'Dữ liệu đã tồn tại trong hệ thống (409 Conflict).';
            break;
          case 500:
            friendlyMessage = 'Máy chủ Backend gặp lỗi xử lý nội bộ (500).';
            break;
          default:
            friendlyMessage = `Lỗi hệ thống (${error.response.status}). Vui lòng thử lại.`;
        }
      }

      const customError = new Error(friendlyMessage);
      (customError as any).status = error.response.status;
      (customError as any).data = data;
      return Promise.reject(customError);
    } else if (error.request) {
      // Không nhận được phản hồi từ server (Network Error, Server chưa chạy, sai IP/Port)
      const networkError = new Error(
        'Không thể kết nối tới máy chủ Backend. Vui lòng kiểm tra kết nối mạng hoặc địa chỉ máy chủ (IP/Port).'
      );
      (networkError as any).isNetworkError = true;
      return Promise.reject(networkError);
    } else {
      return Promise.reject(new Error(error.message || 'Đã có lỗi xảy ra.'));
    }
  }
);
