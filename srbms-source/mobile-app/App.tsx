import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform, Dimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { BrandLogo } from './src/components/BrandLogo';

type AuthScreenState = 'welcome' | 'login' | 'register';

const MainNavigator: React.FC = () => {
  const { user, token, isInitializing } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<AuthScreenState>('welcome');
  const [prefilledCccd, setPrefilledCccd] = useState<string>('');

  // 1. Đang khôi phục session từ AsyncStorage khi khởi động app
  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <BrandLogo size={100} />
        <ActivityIndicator size="large" color="#4579C7" style={styles.loader} />
      </View>
    );
  }

  // 2. Nếu đã đăng nhập thành công (có user và JWT token) -> Điều hướng đến Trang chủ (HomeScreen)
  if (user && token) {
    return <HomeScreen />;
  }

  // 3. Phân luồng các màn hình xác thực
  if (currentScreen === 'login') {
    return (
      <LoginScreen
        onBack={() => setCurrentScreen('welcome')}
        onNavigateToRegister={() => setCurrentScreen('register')}
        initialCccd={prefilledCccd}
      />
    );
  }

  if (currentScreen === 'register') {
    return (
      <RegisterScreen
        onBack={() => setCurrentScreen('welcome')}
        onNavigateToLogin={(registeredCccd) => {
          if (registeredCccd) {
            setPrefilledCccd(registeredCccd);
          }
          setCurrentScreen('login');
        }}
      />
    );
  }

  // Màn hình mặc định ban đầu: WelcomeScreen (khớp với mockup hình ảnh người dùng cung cấp)
  return (
    <WelcomeScreen
      onNavigateToLogin={() => setCurrentScreen('login')}
      onNavigateToRegister={() => setCurrentScreen('register')}
    />
  );
};

// Khung điện thoại mô phỏng khi xem trên trình duyệt Web máy tính
const WebDeviceWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  return (
    <View style={styles.webContainer}>
      <View style={styles.phoneFrame}>
        {/* Tai thỏ / Dynamic Island giả lập của điện thoại */}
        <View style={styles.notchContainer}>
          <View style={styles.dynamicIsland}>
            <View style={styles.cameraLens} />
          </View>
        </View>

        {/* Nội dung ứng dụng */}
        <View style={styles.phoneScreen}>{children}</View>

        {/* Thanh Home bar dưới đáy điện thoại */}
        <View style={styles.homeIndicatorBar} />
      </View>
    </View>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <WebDeviceWrapper>
          <MainNavigator />
        </WebDeviceWrapper>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    marginTop: 24,
  },
  webContainer: {
    flex: 1,
    minHeight: '100%' as any,
    backgroundColor: '#E2E8F0', // Nền màu xám sang trọng bao quanh khung điện thoại
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  phoneFrame: {
    width: '100%',
    maxWidth: 412,
    height: 860,
    maxHeight: '94%' as any,
    backgroundColor: '#FFFFFF',
    borderRadius: 44,
    borderWidth: 10,
    borderColor: '#1E293B', // Viền máy kim loại đen titan
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 28,
    elevation: 20,
  },
  notchContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    pointerEvents: 'none',
  },
  dynamicIsland: {
    width: 100,
    height: 22,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 8,
  },
  cameraLens: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0F172A',
  },
  phoneScreen: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    paddingTop: 14, // Nhường chỗ cho tai thỏ phía trên
  },
  homeIndicatorBar: {
    position: 'absolute',
    bottom: 6,
    alignSelf: 'center',
    width: 130,
    height: 4,
    backgroundColor: '#1E293B',
    borderRadius: 2,
    zIndex: 9999,
    pointerEvents: 'none',
  },
});
