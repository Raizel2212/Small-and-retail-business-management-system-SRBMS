import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BrandLogo } from '../components/BrandLogo';
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';
import { GoogleIcon } from '../components/GoogleIcon';
import { ServerConfigModal } from '../components/ServerConfigModal';
import { ForgotPasswordModal } from '../components/ForgotPasswordModal';
import { useAuth } from '../context/AuthContext';
import { validateLoginIdentifier, validatePassword } from '../utils/validation';

interface LoginScreenProps {
  onBack: () => void;
  onNavigateToRegister: () => void;
  initialCccd?: string;
  isRegisteredSuccess?: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onBack,
  onNavigateToRegister,
  initialCccd = '',
  isRegisteredSuccess = false,
}) => {
  const { login, isLoading, baseUrl, updateBaseUrl } = useAuth();

  // Cho phép đăng nhập bằng Email, Số điện thoại hoặc số CCCD
  const [identifier, setIdentifier] = useState(initialCccd);
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (initialCccd) {
      setIdentifier(initialCccd);
    }
  }, [initialCccd]);

  const [errors, setErrors] = useState<{ identifier?: string; password?: string; general?: string }>({});
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleLogin = async () => {
    // 1. Kiểm tra tính hợp lệ phía Client
    const idErr = validateLoginIdentifier(identifier);
    const passErr = validatePassword(password);

    if (idErr || passErr) {
      setErrors({
        identifier: idErr || undefined,
        password: passErr || undefined,
      });
      return;
    }

    setErrors({});

    try {
      // 2. Gửi request đăng nhập lên Backend
      await login({
        cccd: identifier.trim(),
        password,
      });
      // AuthContext sẽ tự động cập nhật session và chuyển màn hình
    } catch (err: any) {
      const message = err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
      setErrors({
        general: message,
      });
    }
  };

  const handleGoogleLogin = () => {
    Alert.alert(
      'Đăng nhập Google / Gmail',
      'Bạn có muốn điền sẵn tài khoản Gmail hoặc tiếp tục với Google?',
      [
        {
          text: 'Điền mẫu Gmail',
          onPress: () => {
            setIdentifier('nguyenvana123@gmail.com');
          },
        },
        { text: 'Đóng', style: 'cancel' },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Top Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>

        <BrandLogo size={36} showText={true} />

        <TouchableOpacity
          style={styles.serverIconBtn}
          onPress={() => setShowServerConfig(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <Ionicons name="options-outline" size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Lời chào đầu trang */}
          <View style={styles.welcomeBox}>
            <Text style={styles.welcomeTitle}>Chào mừng trở lại!</Text>
            <Text style={styles.welcomeSubtitle}>
              Đăng nhập để tiếp tục đồng hành cùng Hovit.
            </Text>
          </View>

          {/* Banner thông báo đăng ký thành công - CHỈ hiển thị khi vừa đăng ký tài khoản mới thành công */}
          {isRegisteredSuccess && initialCccd ? (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={22} color="#059669" />
              <View style={styles.successBannerContent}>
                <Text style={styles.successBannerTitle}>Đăng ký tài khoản thành công!</Text>
                <Text style={styles.successBannerMessage}>
                  Tài khoản <Text style={{ fontWeight: '700' }}>{initialCccd}</Text> đã được tự động điền sẵn. Vui lòng nhập mật khẩu để đăng nhập.
                </Text>
              </View>
            </View>
          ) : null}

          {/* Banner thông báo lỗi nếu có */}
          {errors.general && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={20} color="#DC2626" />
              <View style={styles.errorBannerContent}>
                <Text style={styles.errorBannerTitle}>Đăng nhập không thành công</Text>
                <Text style={styles.errorBannerMessage}>{errors.general}</Text>
              </View>
            </View>
          )}

          {/* Form đăng nhập */}
          <View style={styles.formCard}>
            <CustomInput
              label="Email hoặc số điện thoại"
              placeholder="Ví dụ: nguyenvana123@gmail.com"
              value={identifier}
              onChangeText={(txt) => {
                setIdentifier(txt);
                if (errors.identifier) setErrors({ ...errors, identifier: undefined, general: undefined });
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              leftIconName="person-outline"
              error={errors.identifier}
            />

            <CustomInput
              label="Mật khẩu"
              placeholder="Nhập mật khẩu"
              value={password}
              onChangeText={(txt) => {
                setPassword(txt);
                if (errors.password) setErrors({ ...errors, password: undefined, general: undefined });
              }}
              isPassword
              leftIconName="lock-closed-outline"
              error={errors.password}
            />

            {/* Quên mật khẩu */}
            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() => setShowForgotModal(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotBtnText}>Quên mật khẩu?</Text>
            </TouchableOpacity>

            {/* Nút Đăng nhập */}
            <CustomButton
              title="Đăng nhập"
              variant="primary"
              loading={isLoading}
              onPress={handleLogin}
              rightIcon={<Ionicons name="arrow-forward" size={18} color="#FFFFFF" />}
              style={styles.submitBtn}
            />
          </View>

          {/* Dải phân cách "Hoặc tiếp tục với" */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Hoặc tiếp tục với</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Nút đăng nhập Google / Gmail (Loại bỏ Apple theo yêu cầu người dùng Android) */}
          <View style={styles.socialContainer}>
            <TouchableOpacity
              style={styles.googleBtn}
              onPress={handleGoogleLogin}
              activeOpacity={0.8}
            >
              <GoogleIcon size={20} />
              <Text style={styles.googleBtnText}>Google</Text>
            </TouchableOpacity>
          </View>

          {/* Chuyển hướng sang màn hình Đăng ký */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Chưa có tài khoản? </Text>
            <TouchableOpacity onPress={onNavigateToRegister} activeOpacity={0.7}>
              <Text style={styles.registerLink}>Đăng ký ngay</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal Cấu hình Server & Quên mật khẩu */}
      <ServerConfigModal
        visible={showServerConfig}
        onClose={() => setShowServerConfig(false)}
        currentUrl={baseUrl}
        onSave={updateBaseUrl}
      />
      <ForgotPasswordModal
        visible={showForgotModal}
        onClose={() => setShowForgotModal(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serverIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  welcomeBox: {
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  successBanner: {
    flexDirection: 'row',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#34D399',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    alignItems: 'flex-start',
  },
  successBannerContent: {
    marginLeft: 10,
    flex: 1,
  },
  successBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 2,
  },
  successBannerMessage: {
    fontSize: 12,
    color: '#047857',
    lineHeight: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#F87171',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    alignItems: 'flex-start',
  },
  errorBannerContent: {
    marginLeft: 10,
    flex: 1,
  },
  errorBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 2,
  },
  errorBannerMessage: {
    fontSize: 12,
    color: '#B91C1C',
    lineHeight: 16,
  },
  formCard: {
    width: '100%',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 12,
    marginTop: -6,
    paddingVertical: 4,
  },
  forgotBtnText: {
    color: '#1E5E4F',
    fontSize: 13,
    fontWeight: '700',
  },
  submitBtn: {
    marginTop: 2,
    backgroundColor: '#1E5E4F',
    height: 50,
    borderRadius: 14,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  socialContainer: {
    width: '100%',
    alignItems: 'center',
  },
  googleBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginLeft: 10,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    paddingBottom: 20,
  },
  footerText: {
    color: '#64748B',
    fontSize: 14,
  },
  registerLink: {
    color: '#1E5E4F',
    fontSize: 14,
    fontWeight: '800',
  },
});
