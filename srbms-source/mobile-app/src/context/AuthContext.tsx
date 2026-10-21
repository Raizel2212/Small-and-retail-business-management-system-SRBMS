import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, LoginRequest, RegisterRequest } from '../types/auth';
import { authApi } from '../api/authApi';
import {
  TOKEN_STORAGE_KEY,
  USER_STORAGE_KEY,
} from '../api/client';
import {
  getStoredBaseUrl,
  setStoredBaseUrl as saveStoredBaseUrl,
} from '../api/config';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isInitializing: boolean;
  baseUrl: string;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<string>;
  logout: () => Promise<void>;
  updateBaseUrl: (newUrl: string) => Promise<void>;
  updateBusinessProfile: (payload: import('../types/auth').BusinessProfileRequest) => Promise<User>;
  updateUser: (updatedUser: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [baseUrl, setBaseUrlState] = useState<string>('http://192.168.1.5:8080');

  // Khôi phục session và baseUrl khi khởi động ứng dụng
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedUrl = await getStoredBaseUrl();
        setBaseUrlState(storedUrl);

        const storedToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
        const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Lỗi khi khôi phục phiên đăng nhập:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(credentials);
      if (response.success && response.data) {
        const { accessToken, user: loggedInUser } = response.data;
        
        // Lưu trữ bảo mật
        await AsyncStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(loggedInUser));

        setToken(accessToken);
        setUser(loggedInUser);
      } else {
        throw new Error(response.message || 'Đăng nhập không thành công');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterRequest): Promise<string> => {
    setIsLoading(true);
    try {
      const response = await authApi.register(payload);
      return response.message || 'Đăng ký tài khoản thành công';
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      // 1. Gửi request đăng xuất lên server Backend
      await authApi.logout();
    } catch (error) {
      // Ngay cả khi kết nối mạng lỗi hoặc token hết hạn, vẫn đảm bảo xóa session cục bộ an toàn
      console.warn('Lỗi khi gọi API logout Backend (vẫn tiếp tục xóa phiên cục bộ):', error);
    } finally {
      try {
        // 2. Luôn xóa sạch Token và User trong AsyncStorage
        await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
        await AsyncStorage.removeItem(USER_STORAGE_KEY);
        setToken(null);
        setUser(null);
      } catch (storageError) {
        console.error('Lỗi khi xóa bộ nhớ phiên đăng nhập:', storageError);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const updateBaseUrl = async (newUrl: string) => {
    await saveStoredBaseUrl(newUrl);
    setBaseUrlState(newUrl);
  };

  const updateBusinessProfile = async (
    payload: import('../types/auth').BusinessProfileRequest
  ): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await authApi.updateBusinessProfile(payload);
      if (response.success && response.data) {
        const mergedUser: User = {
          ...(user as User),
          ...response.data,
          isFirstLogin: false,
        };
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mergedUser));
        setUser(mergedUser);
        return mergedUser;
      } else {
        throw new Error(response.message || 'Cập nhật thông tin hộ kinh doanh thất bại');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (updatedUser: User) => {
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isInitializing,
        baseUrl,
        login,
        register,
        logout,
        updateBaseUrl,
        updateBusinessProfile,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được sử dụng bên trong AuthProvider');
  }
  return context;
};
