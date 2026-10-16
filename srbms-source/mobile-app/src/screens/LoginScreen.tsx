import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';
import { BottomCurve } from '../components/BottomCurve';
import { ServerConfigModal } from '../components/ServerConfigModal';
import { ForgotPasswordModal } from '../components/ForgotPasswordModal';
import { useAuth } from '../context/AuthContext';
import { validateCccd, validatePassword } from '../utils/validation';

interface LoginScreenProps {
  onBack: () => void;
  onNavigateToRegister: () => void;
  initialCccd?: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onBack,
  onNavigateToRegister,
  initialCccd = '',
}) => {
  const { login, isLoading, baseUrl, updateBaseUrl } = useAuth();

  const [cccd, setCccd] = useState(initialCccd);
  const [password, setPassword] = useState('');

  const [errors, setErrors] = useState<{ cccd?: string; password?: string; general?: string }>({});
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleLogin = async () => {
    // 1. Validate phía Client
    const cccdErr = validateCccd(cccd);
    const passErr = validatePassword(password);

    if (cccdErr || passErr) {
      setErrors({
        cccd: cccdErr || undefined,
        password: passErr || undefined,
      });
      return;
    }

    setErrors({});

    try {
      // 2. Bắt API từ Backend: POST /api/v1/auth/login
      await login({
        cccd: cccd.trim(),
        password,
      });
      // AuthContext sẽ tự động cập nhật user & token, chuyển hướng sang HomeScreen
    } catch (err: any) {
      // Trích xuất thông điệp lỗi từ Backend (401, 403, 500, Network error)
      const message = err.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
      setErrors({
        general: message,
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Thanh điều hướng phía trên */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={26} color="#1E56A0" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Đăng nhập</Text>

        <TouchableOpacity
          style={styles.serverIconBtn}
          onPress={() => setShowServerConfig(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="settings-outline" size={20} color="#6B7280" />
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
          {/* Lời chào & Hướng dẫn */}
          <View style={styles.welcomeBox}>
            <Text style={styles.welcomeTitle}>Chào mừng trở lại!</Text>
            <Text style={styles.welcomeSubtitle}>
              Sử dụng số Căn cước công dân (12 chữ số) và mật khẩu đã đăng ký để truy cập hệ thống.
            </Text>
          </View>

          {/* Hộp thông báo lỗi từ Backend nếu có */}
          {errors.general && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={20} color="#DC2626" />
              <View style={styles.errorBannerContent}>
                <Text style={styles.errorBannerTitle}>Đăng nhập không thành công</Text>
                <Text style={styles.errorBannerMessage}>{errors.general}</Text>
              </View>
            </View>
          )}

          {/* Form nhập liệu */}
          <View style={styles.formCard}>
            <CustomInput
              label="Số Căn cước công dân (CCCD)"
              required
              placeholder="VD: 079099001122"
              value={cccd}
              onChangeText={(txt) => {
                setCccd(txt);
                if (errors.cccd) setErrors({ ...errors, cccd: undefined, general: undefined });
              }}
              keyboardType="numeric"
              maxLength={12}
              leftIconName="card-outline"
              error={errors.cccd}
              hint="Số định danh cá nhân 12 chữ số"
            />

            <CustomInput
              label="Mật khẩu"
              required
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

            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() => setShowForgotModal(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotBtnText}>Quên mật khẩu?</Text>
            </TouchableOpacity>

            <CustomButton
              title="Đăng nhập"
              variant="primary"
              loading={isLoading}
              onPress={handleLogin}
              style={styles.submitBtn}
            />
          </View>

          {/* Điều hướng sang Đăng ký */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Chưa có tài khoản? </Text>
            <TouchableOpacity onPress={onNavigateToRegister} activeOpacity={0.7}>
              <Text style={styles.registerLink}>Đăng ký ngay</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomCurve height={40} color="#4579C7" />

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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E56A0',
  },
  serverIconBtn: {
    padding: 6,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 60,
  },
  welcomeBox: {
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#F87171',
    borderRadius: 8,
    padding: 12,
    marginBottom: 18,
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
    marginBottom: 16,
    marginTop: -4,
    paddingVertical: 4,
  },
  forgotBtnText: {
    color: '#1E56A0',
    fontSize: 13,
    fontWeight: '600',
  },
  submitBtn: {
    marginTop: 8,
    backgroundColor: '#4579C7',
    height: 48,
    borderRadius: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
  footerText: {
    color: '#6B7280',
    fontSize: 14,
  },
  registerLink: {
    color: '#1E56A0',
    fontSize: 14,
    fontWeight: '700',
  },
});
