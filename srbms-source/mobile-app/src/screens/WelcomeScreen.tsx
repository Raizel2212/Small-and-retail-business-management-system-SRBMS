import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BrandLogo } from '../components/BrandLogo';
import { CustomButton } from '../components/CustomButton';
import { WelcomeIllustration } from '../components/WelcomeIllustration';

interface WelcomeScreenProps {
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onNavigateToLogin,
  onNavigateToRegister,
}) => {

  const handleOpenTerms = () => {
    Alert.alert(
      'Điều khoản sử dụng',
      'Hệ thống quản lý hộ kinh doanh (SRBMS / Hovit) cam kết bảo mật và minh bạch toàn bộ dữ liệu kế toán và kê khai thuế theo quy định pháp luật Việt Nam.'
    );
  };

  const handleOpenPrivacy = () => {
    Alert.alert(
      'Chính sách bảo mật',
      'Toàn bộ thông tin cá nhân (CCCD, SĐT, Email) và dữ liệu tài chính của hộ kinh doanh được mã hóa và bảo vệ nghiêm ngặt.'
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Top Header Bar với Logo */}
      <View style={styles.topBar}>
        <BrandLogo size={42} showText={true} />
      </View>

      {/* Nội dung chính giữa */}
      <View style={styles.content}>
        {/* Hình minh họa hộ kinh doanh hình tròn chuẩn mockup */}
        <View style={styles.illustrationSection}>
          <WelcomeIllustration size={320} />
        </View>

        {/* Tiêu đề chào mừng */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>
            Chào mừng{'\n'}đến với Hovit!
          </Text>
        </View>

        {/* Khối 2 nút bấm Đăng ký và Đăng nhập */}
        <View style={styles.actionSection}>
          <CustomButton
            title="Đăng ký"
            variant="primary"
            onPress={onNavigateToRegister}
            rightIcon={<Ionicons name="arrow-forward" size={18} color="#FFFFFF" />}
            style={styles.primaryButton}
          />

          <CustomButton
            title="Đăng nhập"
            variant="outline"
            onPress={onNavigateToLogin}
            style={styles.outlineButton}
          />
        </View>

        {/* Đoạn text chính sách và điều khoản ở chân trang */}
        <View style={styles.termsSection}>
          <Text style={styles.termsText}>
            Bằng việc tiếp tục, bạn đồng ý với
          </Text>
          <View style={styles.termsLinksRow}>
            <TouchableOpacity onPress={handleOpenTerms} activeOpacity={0.7}>
              <Text style={styles.linkText}>Điều khoản sử dụng</Text>
            </TouchableOpacity>
            <Text style={styles.termsText}> và </Text>
            <TouchableOpacity onPress={handleOpenPrivacy} activeOpacity={0.7}>
              <Text style={styles.linkText}>Chính sách bảo mật.</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#DBF8F3',
  },
  topBar: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'web' ? 42 : 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 6,
    paddingBottom: 24,
  },
  illustrationSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
  },
  titleSection: {
    alignItems: 'center',
    marginVertical: 8,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#123D32',
    textAlign: 'center',
    lineHeight: 34,
    letterSpacing: -0.4,
  },
  actionSection: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    gap: 12,
  },
  primaryButton: {
    height: 50,
    borderRadius: 14,
    backgroundColor: '#1E5E4F',
    marginVertical: 0,
    shadowColor: '#1E5E4F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  outlineButton: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#1E5E4F',
    backgroundColor: '#FFFFFF',
    marginVertical: 0,
    shadowColor: '#1E5E4F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  termsSection: {
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  termsText: {
    fontSize: 12,
    color: '#47635D',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 2,
  },
  linkText: {
    fontSize: 12,
    color: '#0D6E5D',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
