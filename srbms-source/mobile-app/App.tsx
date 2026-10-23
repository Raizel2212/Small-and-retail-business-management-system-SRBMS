import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform, Dimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { RevenueDetailScreen } from './src/screens/RevenueDetailScreen';
import { BusinessInfoScreen } from './src/screens/BusinessInfoScreen';
import { BrandLogo } from './src/components/BrandLogo';

type AuthScreenState = 'welcome' | 'login' | 'register';
type AppScreenState = 'home' | 'revenue-detail';

const MainNavigator: React.FC = () => {
  const { user, token, isInitializing } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<AuthScreenState>('welcome');
  const [appScreen, setAppScreen] = useState<AppScreenState>('home');
  const [prefilledCccd, setPrefilledCccd] = useState<string>('');
  const [isRegisteredSuccess, setIsRegisteredSuccess] = useState<boolean>(false);
  const [hasCompletedBusinessInfo, setHasCompletedBusinessInfo] = useState<boolean>(false);
  const prevUserRef = useRef(user);

  // Theo dõi trạng thái phiên đăng nhập:
  // - Khi có user: sẵn sàng đưa về màn hình 'login' và lưu lại CCCD
  // - Khi user vừa đăng xuất (chuyển từ có dữ liệu sang null): đưa ngay về màn hình 'login', KHÔNG hiện banner đăng ký
  useEffect(() => {
    if (user) {
      if (user.cccd) {
        setPrefilledCccd(user.cccd);
      }
      setIsRegisteredSuccess(false);
      setCurrentScreen('login');
      // Nếu user đã có thông tin hộ kinh doanh thì đánh dấu hoàn thành
      if (user.isFirstLogin === false && user.businessGroup) {
        setHasCompletedBusinessInfo(true);
      }
    } else if (prevUserRef.current && !user) {
      if (prevUserRef.current.cccd) {
        setPrefilledCccd(prevUserRef.current.cccd);
      }
      setIsRegisteredSuccess(false);
      setHasCompletedBusinessInfo(false);
      setCurrentScreen('login');
      setAppScreen('home');
    }
    prevUserRef.current = user;
  }, [user]);

  // 1. Đang khôi phục session từ AsyncStorage khi khởi động app
  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <BrandLogo size={48} />
        <ActivityIndicator size="large" color="#1E5E4F" style={styles.loader} />
      </View>
    );
  }

  // 2. Nếu đã đăng nhập thành công (có user và JWT token)
  if (user && token) {
    // Trường hợp 1: Nếu user lần đầu tiên đăng nhập vào -> tới trang điền chi tiết thông tin hộ kinh doanh
    if ((user.isFirstLogin === true || !user.businessGroup) && !hasCompletedBusinessInfo) {
      return (
        <BusinessInfoScreen
          onComplete={() => {
            // Sau khi ấn "Tiếp tục", chuyển ngay vào Trang chủ (HomeScreen)
            setHasCompletedBusinessInfo(true);
            setAppScreen('home');
          }}
        />
      );
    }

    // Xem màn hình Chi tiết Doanh thu
    if (appScreen === 'revenue-detail') {
      return (
        <RevenueDetailScreen
          onBack={() => setAppScreen('home')}
        />
      );
    }

    // Trường hợp 2: Nếu từ lần thứ 2 đăng nhập -> Vào thẳng trang chủ luôn
    return (
      <HomeScreen
        onNavigateToRevenueDetail={() => setAppScreen('revenue-detail')}
      />
    );
  }

  // 3. Phân luồng các màn hình xác thực
  if (currentScreen === 'login') {
    return (
      <LoginScreen
        onBack={() => {
          setIsRegisteredSuccess(false);
          setCurrentScreen('welcome');
        }}
        onNavigateToRegister={() => {
          setIsRegisteredSuccess(false);
          setCurrentScreen('register');
        }}
        initialCccd={prefilledCccd}
        isRegisteredSuccess={isRegisteredSuccess}
      />
    );
  }

  if (currentScreen === 'register') {
    return (
      <RegisterScreen
        onBack={() => {
          setIsRegisteredSuccess(false);
          setCurrentScreen('welcome');
        }}
        onNavigateToLogin={(registeredCccd) => {
          if (registeredCccd) {
            setPrefilledCccd(registeredCccd);
            setIsRegisteredSuccess(true);
          } else {
            setIsRegisteredSuccess(false);
          }
          setCurrentScreen('login');
        }}
      />
    );
  }

  // Màn hình mặc định ban đầu: WelcomeScreen (khớp với mockup hình ảnh người dùng cung cấp)
  return (
    <WelcomeScreen
      onNavigateToLogin={() => {
        setIsRegisteredSuccess(false);
        setCurrentScreen('login');
      }}
      onNavigateToRegister={() => {
        setIsRegisteredSuccess(false);
        setCurrentScreen('register');
      }}
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
    backgroundColor: '#DBF8F3',
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
    backgroundColor: '#DBF8F3',
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
