import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
  KeyboardAvoidingView,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from '../components/BrandLogo';
import { CustomButton } from '../components/CustomButton';

interface BusinessInfoScreenProps {
  onComplete: () => void;
}

// 4 nhóm Hộ kinh doanh theo quy mô doanh thu
const REVENUE_GROUPS = [
  {
    group: 1,
    label: 'Nhóm 1 — Dưới 1 tỷ',
    revenueRange: 'Dưới 1 tỷ',
  },
  {
    group: 2,
    label: 'Nhóm 2 — Từ 1 tỷ đến 3 tỷ',
    revenueRange: 'Từ 1 tỷ đến 3 tỷ',
  },
  {
    group: 3,
    label: 'Nhóm 3 — Từ 3 tỷ đến 50 tỷ',
    revenueRange: 'Từ 3 tỷ đến 50 tỷ',
  },
  {
    group: 4,
    label: 'Nhóm 4 — Trên 50 tỷ',
    revenueRange: 'Trên 50 tỷ',
  },
];

// Danh sách 4 ngành nghề kinh doanh theo thiết kế
const INDUSTRY_TYPES = [
  { id: 'ban_le', label: 'Bán lẻ' },
  { id: 'an_uong', label: 'Ăn uống' },
  { id: 'dich_vu', label: 'Dịch vụ' },
  { id: 'khac', label: 'Khác' },
];

export const BusinessInfoScreen: React.FC<BusinessInfoScreenProps> = ({ onComplete }) => {
  const { user, updateBusinessProfile, logout } = useAuth();

  // Mặc định chọn Nhóm 1 và Khác (khớp theo mẫu giao diện được cung cấp)
  const [selectedGroup, setSelectedGroup] = useState<number>(1);
  const [selectedType, setSelectedType] = useState<string>('khac');
  const [otherTypeText, setOtherTypeText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  const handleSubmit = async () => {
    setErrorMessage('');

    if (!selectedGroup) {
      setErrorMessage('Vui lòng chọn nhóm doanh thu của hộ kinh doanh');
      return;
    }

    if (!selectedType) {
      setErrorMessage('Vui lòng chọn ngành nghề kinh doanh');
      return;
    }

    if (selectedType === 'khac' && !otherTypeText.trim()) {
      setErrorMessage('Vui lòng nhập ngành nghề khác của bạn');
      return;
    }

    const typeObj = INDUSTRY_TYPES.find((t) => t.id === selectedType);
    const businessTypeLabel = typeObj ? typeObj.label : selectedType;
    const groupObj = REVENUE_GROUPS.find((g) => g.group === selectedGroup);

    setIsLoading(true);
    try {
      await updateBusinessProfile({
        businessGroup: selectedGroup,
        businessType: businessTypeLabel,
        revenueRange: groupObj?.revenueRange,
        otherBusinessType: selectedType === 'khac' ? otherTypeText.trim() : undefined,
      });

      // Điều hướng vào màn hình tiếp theo / Trang chủ
      onComplete();
    } catch (err: any) {
      const msg = err.message || 'Không thể lưu thông tin. Vui lòng thử lại.';
      setErrorMessage(msg);
      if (Platform.OS !== 'web') {
        Alert.alert('Lỗi cập nhật', msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Watermark Background Illustration giống trang Login */}
      <View style={styles.backgroundIllustrationBox} pointerEvents="none">
        <Image
          source={require('../../assets/welcome_illustration.png')}
          style={styles.backgroundIllustration}
          resizeMode="contain"
        />
      </View>

      {/* Header Bar */}
      <View style={styles.headerBar}>
        <BrandLogo size={36} showText={true} />

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => setShowLogoutModal(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color="#0D6E5D" />
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
          {/* Tiêu đề & Giới thiệu */}
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>Thông tin chủ hộ</Text>
            <Text style={styles.subtitle}>
              Chia sẻ một chút về việc kinh doanh để Hovit đồng hành cùng bạn.
            </Text>
          </View>

          {/* Thông báo lỗi nếu có */}
          {errorMessage ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color="#DC2626" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* ======================================================== */}
          {/* MỤC 1: NHÓM DOANH THU CỦA HỘ KINH DOANH */}
          {/* ======================================================== */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nhóm doanh thu của hộ kinh doanh</Text>

            <View style={styles.radioList}>
              {REVENUE_GROUPS.map((item) => {
                const isSelected = selectedGroup === item.group;
                return (
                  <TouchableOpacity
                    key={item.group}
                    style={[
                      styles.radioCard,
                      isSelected && styles.radioCardSelected,
                    ]}
                    onPress={() => setSelectedGroup(item.group)}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        isSelected && styles.radioCircleSelected,
                      ]}
                    >
                      {isSelected && <View style={styles.radioDot} />}
                    </View>
                    <Text
                      style={[
                        styles.radioLabel,
                        isSelected && styles.radioLabelSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ======================================================== */}
          {/* MỤC 2: NGÀNH NGHỀ KINH DOANH */}
          {/* ======================================================== */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ngành nghề kinh doanh</Text>

            <View style={styles.industryRow}>
              {INDUSTRY_TYPES.map((type) => {
                const isSelected = selectedType === type.id;
                return (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.industryBtn,
                      isSelected && styles.industryBtnSelected,
                    ]}
                    onPress={() => setSelectedType(type.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.industryBtnText,
                        isSelected && styles.industryBtnTextSelected,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Ô nhập khi chọn ngành nghề Khác */}
            {selectedType === 'khac' && (
              <View style={styles.customTypeContainer}>
                <TextInput
                  style={styles.customTypeInput}
                  placeholder="Nhập ngành nghề khác của bạn"
                  placeholderTextColor="#94A3B8"
                  value={otherTypeText}
                  onChangeText={(txt) => {
                    setOtherTypeText(txt);
                    if (errorMessage) setErrorMessage('');
                  }}
                  autoCapitalize="sentences"
                />
                <Text style={styles.customTypeHint}>Ví dụ: Sản xuất đồ thủ công</Text>
              </View>
            )}
          </View>

          {/* ======================================================== */}
          {/* NÚT TIẾP TỤC */}
          {/* ======================================================== */}
          <View style={styles.actionContainer}>
            <CustomButton
              title="Tiếp tục"
              variant="primary"
              loading={isLoading}
              onPress={handleSubmit}
              rightIcon={<Ionicons name="arrow-forward" size={18} color="#FFFFFF" />}
              style={styles.submitBtn}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal Xác nhận Đăng xuất */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.logoutModalBox}>
            <View style={styles.logoutIconCircle}>
              <Ionicons name="log-out" size={26} color="#DC2626" />
            </View>
            <Text style={styles.logoutModalTitle}>Xác nhận đăng xuất</Text>
            <Text style={styles.logoutModalDesc}>
              Bạn có chắc chắn muốn đăng xuất khỏi tài khoản{' '}
              <Text style={{ fontWeight: '700', color: '#1E293B' }}>
                {user?.fullName || 'Hộ kinh doanh'}
              </Text>?
            </Text>

            <View style={styles.logoutModalBtnRow}>
              <TouchableOpacity
                style={styles.logoutCancelBtn}
                disabled={isLoggingOut}
                onPress={() => setShowLogoutModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.logoutCancelText}>Hủy bỏ</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.logoutConfirmBtn, isLoggingOut && { opacity: 0.7 }]}
                disabled={isLoggingOut}
                onPress={async () => {
                  setIsLoggingOut(true);
                  try {
                    await logout();
                    setShowLogoutModal(false);
                  } catch (e) {
                    setShowLogoutModal(false);
                  } finally {
                    setIsLoggingOut(false);
                  }
                }}
                activeOpacity={0.8}
              >
                {isLoggingOut ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.logoutConfirmText}>Đăng xuất</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#DBF8F3', // Nền xanh thương hiệu Hovit giống trang Login
  },
  backgroundIllustrationBox: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
    pointerEvents: 'none',
  },
  backgroundIllustration: {
    width: 360,
    height: 234,
    opacity: 0.16, // Mờ nhẹ nhàng, tinh tế, vừa thấy hình vẽ vừa không chói, chữ nổi bật 100%
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 42 : 12,
    paddingBottom: 10,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  logoutBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BFE7DE',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E5E4F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  keyboardView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  titleSection: {
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#123D32',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#335E54',
    lineHeight: 19,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#F87171',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#123D32',
    marginBottom: 12,
  },
  radioList: {
    gap: 10,
  },
  radioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#BFE7DE',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    shadowColor: '#1E5E4F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  radioCardSelected: {
    borderWidth: 1.5,
    borderColor: '#1E5E4F',
    backgroundColor: '#EAF6F3', // Màu nền xanh mint nhạt khi được chọn
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioCircleSelected: {
    borderWidth: 2,
    borderColor: '#1E5E4F',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1E5E4F',
  },
  radioLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#123D32',
  },
  radioLabelSelected: {
    fontWeight: '700',
    color: '#1E5E4F',
  },
  industryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  industryBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#BFE7DE',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E5E4F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  industryBtnSelected: {
    borderWidth: 1.5,
    borderColor: '#1E5E4F',
    backgroundColor: '#EAF6F3',
  },
  industryBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#335E54',
  },
  industryBtnTextSelected: {
    fontWeight: '700',
    color: '#1E5E4F',
  },
  customTypeContainer: {
    marginTop: 12,
  },
  customTypeInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#BFE7DE',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#0F172A',
  },
  customTypeHint: {
    fontSize: 12,
    color: '#47635D',
    marginTop: 6,
    marginLeft: 2,
  },
  actionContainer: {
    marginTop: 16,
  },
  submitBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: '#1E5E4F', // Khớp tông màu thương hiệu của trang login
    marginTop: 8,
    shadowColor: '#1E5E4F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoutModalBox: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
  logoutIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoutModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  logoutModalDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
  },
  logoutModalBtnRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  logoutCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  logoutConfirmBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  logoutConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
