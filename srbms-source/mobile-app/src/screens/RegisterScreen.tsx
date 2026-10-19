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
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BrandLogo } from '../components/BrandLogo';
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';
import { GoogleIcon } from '../components/GoogleIcon';
import { ServerConfigModal } from '../components/ServerConfigModal';
import { useAuth } from '../context/AuthContext';
import {
  validateCccd,
  validatePassword,
  validateFullName,
  validatePhone,
  validateEmail,
} from '../utils/validation';

interface RegisterScreenProps {
  onBack: () => void;
  onNavigateToLogin: (prefilledCccd?: string) => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onBack,
  onNavigateToLogin,
}) => {
  const { register, isLoading, baseUrl, updateBaseUrl } = useAuth();

  // Các trường thông tin đăng ký theo đúng thiết kế và API backend
  const [fullName, setFullName] = useState('');
  const [cccd, setCccd] = useState('');
  const [sdt, setSdt] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [showServerConfig, setShowServerConfig] = useState(false);

  const handleRegister = async () => {
    // 1. Kiểm tra tính hợp lệ dữ liệu phía Client
    const newErrors: Record<string, string | undefined> = {};

    const nameErr = validateFullName(fullName);
    if (nameErr) newErrors.fullName = nameErr;

    const cccdErr = validateCccd(cccd);
    if (cccdErr) newErrors.cccd = cccdErr;

    const phoneErr = validatePhone(sdt);
    if (phoneErr) newErrors.sdt = phoneErr;

    const emailErr = validateEmail(email);
    if (emailErr) newErrors.email = emailErr;

    const passErr = validatePassword(password);
    if (passErr) newErrors.password = passErr;

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không trùng khớp';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    try {
      // 2. Gửi request đăng ký lên Backend: POST /api/v1/auth/register
      await register({
        fullName: fullName.trim(),
        cccd: cccd.trim(),
        sdt: sdt.trim(),
        email: email.trim(),
        password,
      });

      // 3. Chuyển ngay sang màn hình Đăng nhập kèm điền sẵn số CCCD / Email
      onNavigateToLogin(cccd.trim());
    } catch (err: any) {
      const message = err.message || 'Đăng ký không thành công. Vui lòng thử lại.';
      setErrors({
        general: message,
      });
    }
  };

  const handleGoogleRegister = () => {
    Alert.alert(
      'Đăng ký nhanh bằng Google / Gmail',
      'Bạn có muốn điền mẫu thông tin bằng tài khoản Gmail?',
      [
        {
          text: 'Điền mẫu Gmail',
          onPress: () => {
            setEmail('nguyenvana123@gmail.com');
            if (!fullName) setFullName('Nguyễn Văn A');
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
        <View style={styles.headerLeftGroup}>
          {/* Nút quay lại bo tròn nhẹ màu xanh nhạt theo mockup */}
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButtonBadge}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color="#1E5E4F" />
          </TouchableOpacity>

          <BrandLogo size={36} showText={true} />
        </View>

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
          {/* Tiêu đề màn hình đăng ký theo mockup */}
          <View style={styles.titleBox}>
            <Text style={styles.screenTitle}>Tên Hộ kinh doanh</Text>
            <Text style={styles.screenSubtitle}>
              Ví dụ: Hộ kinh doanh Nguyễn Văn A
            </Text>
          </View>

          {/* Banner lỗi từ Backend */}
          {errors.general && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={20} color="#DC2626" />
              <View style={styles.errorBannerContent}>
                <Text style={styles.errorBannerTitle}>Đăng ký không thành công</Text>
                <Text style={styles.errorBannerMessage}>{errors.general}</Text>
              </View>
            </View>
          )}

          {/* Form điền thông tin đăng ký */}
          <View style={styles.formCard}>
            <CustomInput
              label="Họ và tên chủ hộ"
              required
              placeholder="Ví dụ: Nguyễn Văn A"
              value={fullName}
              onChangeText={(txt) => {
                setFullName(txt);
                if (errors.fullName) setErrors({ ...errors, fullName: undefined, general: undefined });
              }}
              leftIconName="person-outline"
              error={errors.fullName}
            />

            <CustomInput
              label="Số Căn cước công dân (CCCD)"
              required
              placeholder="Ví dụ: 059**********689"
              value={cccd}
              onChangeText={(txt) => {
                setCccd(txt);
                if (errors.cccd) setErrors({ ...errors, cccd: undefined, general: undefined });
              }}
              keyboardType="numeric"
              maxLength={12}
              leftIconName="card-outline"
              error={errors.cccd}
              hint="Đúng 12 số trên CCCD"
            />

            <CustomInput
              label="Số điện thoại"
              required
              placeholder="Ví dụ: 08*****692"
              value={sdt}
              onChangeText={(txt) => {
                setSdt(txt);
                if (errors.sdt) setErrors({ ...errors, sdt: undefined, general: undefined });
              }}
              keyboardType="phone-pad"
              maxLength={15}
              leftIconName="call-outline"
              error={errors.sdt}
            />

            <CustomInput
              label="Địa chỉ Email"
              required
              placeholder="Ví dụ: nguyenvana123@gmail.com"
              value={email}
              onChangeText={(txt) => {
                setEmail(txt);
                if (errors.email) setErrors({ ...errors, email: undefined, general: undefined });
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIconName="mail-outline"
              error={errors.email}
            />

            {/* Mật khẩu và Xác nhận mật khẩu để hoàn tất đăng ký tài khoản */}
            <CustomInput
              label="Mật khẩu"
              required
              placeholder="Tối thiểu 6 ký tự"
              value={password}
              onChangeText={(txt) => {
                setPassword(txt);
                if (errors.password) setErrors({ ...errors, password: undefined, general: undefined });
              }}
              isPassword
              leftIconName="lock-closed-outline"
              error={errors.password}
            />

            <CustomInput
              label="Xác nhận mật khẩu"
              required
              placeholder="Nhập lại mật khẩu"
              value={confirmPassword}
              onChangeText={(txt) => {
                setConfirmPassword(txt);
                if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
              }}
              isPassword
              leftIconName="shield-checkmark-outline"
              error={errors.confirmPassword}
            />

            {/* Nút bấm Đăng ký */}
            <CustomButton
              title="Đăng ký"
              variant="primary"
              loading={isLoading}
              onPress={handleRegister}
              rightIcon={<Ionicons name="arrow-forward" size={18} color="#FFFFFF" />}
              style={styles.submitBtn}
            />
          </View>

          {/* Dải phân cách */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Hoặc tiếp tục với</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Nút đăng ký với Google / Gmail (Loại bỏ Apple theo yêu cầu Android) */}
          <View style={styles.socialContainer}>
            <TouchableOpacity
              style={styles.googleBtn}
              onPress={handleGoogleRegister}
              activeOpacity={0.8}
            >
              <GoogleIcon size={20} />
              <Text style={styles.googleBtnText}>Google</Text>
            </TouchableOpacity>
          </View>

          {/* Chuyển hướng sang màn hình Đăng nhập */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => onNavigateToLogin()} activeOpacity={0.7}>
              <Text style={styles.loginLink}>Đăng nhập ngay</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal Cấu hình Server */}
      <ServerConfigModal
        visible={showServerConfig}
        onClose={() => setShowServerConfig(false)}
        currentUrl={baseUrl}
        onSave={updateBaseUrl}
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
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonBadge: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#EBF6F2',
    borderWidth: 1,
    borderColor: '#D4ECE4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
    paddingTop: 12,
    paddingBottom: 64,
  },
  titleBox: {
    marginBottom: 20,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    fontSize: 13,
    color: '#64748B',
  },
  errorBanner: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#F87171',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
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
  submitBtn: {
    marginTop: 10,
    backgroundColor: '#1E5E4F',
    height: 52,
    borderRadius: 14,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
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
    height: 50,
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
    marginTop: 24,
    marginBottom: 16,
  },
  footerText: {
    color: '#64748B',
    fontSize: 14,
  },
  loginLink: {
    color: '#1E5E4F',
    fontSize: 14,
    fontWeight: '800',
  },
});
