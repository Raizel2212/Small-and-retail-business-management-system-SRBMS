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
    try {
      await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error);
    }
  };

  const updateBaseUrl = async (newUrl: string) => {
    await saveStoredBaseUrl(newUrl);
    setBaseUrlState(newUrl);
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
