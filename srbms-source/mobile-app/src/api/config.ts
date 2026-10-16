import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const BASE_URL_STORAGE_KEY = '@srbms_api_base_url';

export const DEFAULT_DEV_IPS = {
  WIFI_LAN: 'http://192.168.1.5:8080',
  ANDROID_EMULATOR: 'http://10.0.2.2:8080',
  IOS_OR_WEB: 'http://localhost:8080',
};

export const getDefaultBaseUrl = (): string => {
  if (Platform.OS === 'android') {
    // 10.0.2.2 cho Android Emulator, hoặc WiFi LAN cho thiết bị thật
    return DEFAULT_DEV_IPS.ANDROID_EMULATOR;
  }
  if (Platform.OS === 'ios') {
    return DEFAULT_DEV_IPS.IOS_OR_WEB;
  }
  return DEFAULT_DEV_IPS.IOS_OR_WEB;
};

export const getStoredBaseUrl = async (): Promise<string> => {
  try {
    const stored = await AsyncStorage.getItem(BASE_URL_STORAGE_KEY);
    if (stored) {
      return stored;
    }
  } catch (error) {
    console.warn('Lỗi khi đọc baseUrl từ AsyncStorage:', error);
  }
  return getDefaultBaseUrl();
};

export const setStoredBaseUrl = async (url: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(BASE_URL_STORAGE_KEY, url.trim().replace(/\/+$/, ''));
  } catch (error) {
    console.error('Lỗi khi lưu baseUrl vào AsyncStorage:', error);
  }
};
