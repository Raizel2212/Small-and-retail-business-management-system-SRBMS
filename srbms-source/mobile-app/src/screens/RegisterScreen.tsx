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
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';
import { BottomCurve } from '../components/BottomCurve';
import { ServerConfigModal } from '../components/ServerConfigModal';
import { useAuth } from '../context/AuthContext';
import {
  validateCccd,
  validatePassword,
  validateFullName,
  validatePhone,
  validateEmail,
  validateDateOfBirth,
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

  // Các trường thông tin DTO khớp với Backend RegisterRequest
  const [fullName, setFullName] = useState('');
  const [cccd, setCccd] = useState('');
  const [sdt, setSdt] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
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

    const dobErr = validateDateOfBirth(dateOfBirth);
    if (dobErr) newErrors.dateOfBirth = dobErr;

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
      const successMessage = await register({
        fullName: fullName.trim(),
        cccd: cccd.trim(),
        sdt: sdt.trim(),
        email: email.trim(),
        username: username.trim() || undefined,
        dateOfBirth: dateOfBirth.trim() || undefined,
        password,
      });

      // 3. Thông báo thành công và chuyển sang màn hình Đăng nhập kèm điền sẵn số CCCD
      Alert.alert(
        'Đăng ký thành công',
        `${successMessage}\n\nBạn có thể sử dụng số CCCD ${cccd.trim()} để đăng nhập ngay bây giờ.`,
        [
          {
            text: 'Đăng nhập ngay',
            onPress: () => onNavigateToLogin(cccd.trim()),
          },
        ]
      );
    } catch (err: any) {
      // Xử lý khi Backend trả về mã lỗi 409 Conflict (Trùng CCCD, SĐT, Email) hoặc 400
      const message = err.message || 'Đăng ký không thành công. Vui lòng thử lại.';
      setErrors({
        general: message,
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Header bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={26} color="#1E56A0" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Đăng ký tài khoản</Text>

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
          <View style={styles.introBox}>
            <Text style={styles.introTitle}>Tạo tài khoản Hộ Kinh Doanh</Text>
            <Text style={styles.introSubtitle}>
              Thông tin đăng ký được liên kết và đối soát theo chuẩn định danh điện tử của cơ quan chức năng.
            </Text>
          </View>

          {/* Lỗi tổng quát từ máy chủ (409 Conflict / 400 Bad Request / 500) */}
          {errors.general && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={20} color="#DC2626" />
              <View style={styles.errorBannerContent}>
                <Text style={styles.errorBannerTitle}>Đăng ký không thành công</Text>
                <Text style={styles.errorBannerMessage}>{errors.general}</Text>
              </View>
            </View>
          )}

          <View style={styles.formCard}>
            <CustomInput
              label="Họ và tên chủ hộ"
              required
              placeholder="VD: Nguyễn Văn A"
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
              hint="Đúng 12 chữ số theo quy định"
            />

            <CustomInput
              label="Số điện thoại"
              required
              placeholder="VD: 0901234567"
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
              placeholder="VD: nguyenvana@gmail.com"
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

            <CustomInput
              label="Tên đăng nhập (Tùy chọn)"
              placeholder="Mặc định lấy theo số CCCD"
              value={username}
              onChangeText={(txt) => setUsername(txt)}
              autoCapitalize="none"
              leftIconName="at-outline"
              error={errors.username}
            />

            <CustomInput
              label="Ngày sinh (Tùy chọn)"
              placeholder="Định dạng: YYYY-MM-DD (VD: 1995-05-20)"
              value={dateOfBirth}
              onChangeText={(txt) => {
                setDateOfBirth(txt);
                if (errors.dateOfBirth) setErrors({ ...errors, dateOfBirth: undefined });
              }}
              leftIconName="calendar-outline"
              error={errors.dateOfBirth}
              hint="Năm-Tháng-Ngày (VD: 1990-12-25)"
            />

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

            <CustomButton
              title="Đăng ký tài khoản"
              variant="primary"
              loading={isLoading}
              onPress={handleRegister}
              style={styles.submitBtn}
            />
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => onNavigateToLogin()} activeOpacity={0.7}>
              <Text style={styles.loginLink}>Đăng nhập ngay</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomCurve height={35} color="#4579C7" />

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
    paddingTop: 16,
    paddingBottom: 60,
  },
  introBox: {
    marginBottom: 20,
  },
  introTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  introSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  errorBanner: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#F87171',
    borderRadius: 8,
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
    marginTop: 12,
    backgroundColor: '#4579C7',
    height: 48,
    borderRadius: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  footerText: {
    color: '#6B7280',
    fontSize: 14,
  },
  loginLink: {
    color: '#1E56A0',
    fontSize: 14,
    fontWeight: '700',
  },
});
