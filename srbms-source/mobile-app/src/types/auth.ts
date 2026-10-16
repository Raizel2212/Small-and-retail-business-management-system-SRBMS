export interface User {
  id: number;
  cccd: string;
  username: string;
  fullName: string;
  email: string;
  sdt: string;
  role: string;
  status: 'ACTIVE' | 'LOCKED' | string;
  dateOfBirth?: string;
  isFirstLogin?: boolean;
  businessGroup?: number | null;
  businessType?: string | null;
  otherBusinessType?: string | null;
  businessName?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface BusinessProfileRequest {
  businessGroup: number;
  businessType: string;
  otherBusinessType?: string;
  businessName?: string;
}

export interface AuthData {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface LoginRequest {
  cccd: string;
  password: string;
}

export interface RegisterRequest {
  cccd: string;
  password: string;
  fullName: string;
  username?: string;
  sdt: string;
  email: string;
  dateOfBirth?: string;
}

export interface ValidationErrors {
  cccd?: string;
  password?: string;
  confirmPassword?: string;
  fullName?: string;
  username?: string;
  sdt?: string;
  email?: string;
  dateOfBirth?: string;
  general?: string;
}
