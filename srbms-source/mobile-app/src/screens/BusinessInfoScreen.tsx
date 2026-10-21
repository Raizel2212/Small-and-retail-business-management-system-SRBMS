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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from '../components/BrandLogo';
import { CustomButton } from '../components/CustomButton';

interface BusinessInfoScreenProps {
  onComplete: () => void;
}

// 3 nhóm Hộ kinh doanh theo quy định quản lý thuế & doanh thu
const BUSINESS_GROUPS = [
  {
    group: 1,
    title: 'Hộ kinh doanh Nhóm 1',
    subtitle: 'Doanh thu dưới 100 triệu VNĐ/năm',
    description: 'Được miễn lệ phí môn bài, không phải nộp thuế GTGT và thuế TNCN.',
    icon: 'shield-checkmark-outline' as const,
    color: '#059669',
    bgColor: '#ECFDF5',
  },
  {
    group: 2,
    title: 'Hộ kinh doanh Nhóm 2',
    subtitle: 'Doanh thu từ 100 - 300 triệu VNĐ/năm',
    description: 'Nộp thuế theo tỷ lệ % doanh thu hoặc áp dụng phương pháp khoán định kỳ.',
    icon: 'calculator-outline' as const,
    color: '#2563EB',
    bgColor: '#EFF6FF',
  },
  {
    group: 3,
    title: 'Hộ kinh doanh Nhóm 3',
    subtitle: 'Doanh thu trên 300 triệu VNĐ/năm',
    description: 'Kê khai định kỳ theo tháng/quý, bắt buộc sử dụng Hóa đơn điện tử có mã của CQT.',
    icon: 'receipt-outline' as const,
    color: '#7C3AED',
    bgColor: '#F5F3FF',
  },
];

// Danh sách các loại hình kinh doanh chính và mục Khác
const BUSINESS_TYPES = [
  {
    id: 'thuong_mai',
    label: 'Thương mại',
    sublabel: 'Phân phối, bán lẻ, tạp hóa, thời trang, siêu thị mini',
    icon: 'cart-outline' as const,
  },
  {
    id: 'dich_vu',
    label: 'Dịch vụ',
    sublabel: 'Ăn uống, cafe, sửa chữa, lưu trú, làm đẹp, spa',
    icon: 'restaurant-outline' as const,
  },
  {
    id: 'san_xuat',
    label: 'Sản xuất',
    sublabel: 'Chế biến nông sản, thực phẩm, gia công mỹ nghệ, may mặc',
    icon: 'hammer-outline' as const,
  },
  {
    id: 'xay_dung',
    label: 'Xây dựng & Vận tải',
    sublabel: 'Xây lắp, bốc xếp hàng hóa, giao vận logistics',
    icon: 'construct-outline' as const,
  },
  {
    id: 'khac',
    label: 'Khác',
    sublabel: 'Ngành nghề kinh doanh đặc thù (Người dùng tự điền)',
    icon: 'create-outline' as const,
  },
];

export const BusinessInfoScreen: React.FC<BusinessInfoScreenProps> = ({ onComplete }) => {
  const { user, updateBusinessProfile, logout } = useAuth();

  const [selectedGroup, setSelectedGroup] = useState<number>(1);
  const [selectedType, setSelectedType] = useState<string>('thuong_mai');
  const [otherTypeText, setOtherTypeText] = useState<string>('');
  const [businessName, setBusinessName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  const handleSubmit = async () => {
    setErrorMessage('');

    // Kiểm tra tính hợp lệ
    if (!selectedGroup) {
      setErrorMessage('Vui lòng chọn nhóm hộ kinh doanh (1, 2 hoặc 3)');
      return;
    }

    if (!selectedType) {
      setErrorMessage('Vui lòng chọn loại hình kinh doanh');
      return;
    }

    if (selectedType === 'khac' && !otherTypeText.trim()) {
      setErrorMessage('Vui lòng điền chi tiết loại hình kinh doanh khác của bạn');
      return;
    }

    const typeObj = BUSINESS_TYPES.find((t) => t.id === selectedType);
    const businessTypeLabel = typeObj ? typeObj.label : selectedType;

    setIsLoading(true);
    try {
      await updateBusinessProfile({
        businessGroup: selectedGroup,
        businessType: businessTypeLabel,
        otherBusinessType: selectedType === 'khac' ? otherTypeText.trim() : undefined,
        businessName: businessName.trim() || undefined,
      });

      // Điều hướng vào Trang chủ
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

      {/* Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <BrandLogo size={32} showText={false} />
          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle}>HỘ KINH DOANH</Text>
            <Text style={styles.headerSubtitle}>Thiết lập tài khoản lần đầu</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => setShowLogoutModal(true)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={22} color="#DC2626" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Chào Mừng & Hướng dẫn */}
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeIconCircle}>
            <Ionicons name="sparkles" size={24} color="#1E56A0" />
          </View>
          <View style={styles.welcomeTextBox}>
            <Text style={styles.welcomeGreeting}>
              Xin chào, <Text style={styles.userNameHighlight}>{user?.fullName || 'Chủ hộ kinh doanh'}</Text>!
            </Text>
            <Text style={styles.welcomeGuide}>
              Để hệ thống tự động tối ưu sổ sách kế toán và kê khai thuế phù hợp, bạn vui lòng hoàn thành 2 bước thông tin bên dưới:
            </Text>
          </View>
        </View>

        {/* Thông báo lỗi nếu có */}
        {errorMessage ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={20} color="#DC2626" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* ======================================================== */}
        {/* MỤC 1: HỘ KINH DOANH NHÓM MẤY (THANH CUỘN TỪ 1 - 3) */}
        {/* ======================================================== */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionNumberCircle}>
              <Text style={styles.sectionNumberText}>1</Text>
            </View>
            <View style={styles.sectionHeaderTextCol}>
              <Text style={styles.sectionTitle}>Hộ kinh doanh nhóm mấy?</Text>
              <Text style={styles.sectionSubtitle}>
                Thanh cuộn chọn từ 1 đến 3 theo quy mô doanh thu
              </Text>
            </View>
          </View>

          {/* Thanh cuộn ngang hiển thị từ Nhóm 1 đến Nhóm 3 */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.groupScrollContainer}
          >
            {BUSINESS_GROUPS.map((item) => {
              const isSelected = selectedGroup === item.group;
              return (
                <TouchableOpacity
                  key={item.group}
                  style={[
                    styles.groupCard,
                    isSelected && {
                      borderColor: item.color,
                      backgroundColor: item.bgColor,
                      borderWidth: 2,
                    },
                  ]}
                  onPress={() => setSelectedGroup(item.group)}
                  activeOpacity={0.8}
                >
                  <View style={styles.groupCardHeader}>
                    <View
                      style={[
                        styles.groupIconBox,
                        { backgroundColor: isSelected ? item.color : '#E2E8F0' },
                      ]}
                    >
                      <Ionicons
                        name={item.icon}
                        size={20}
                        color={isSelected ? '#FFFFFF' : '#475569'}
                      />
                    </View>
                    <View
                      style={[
                        styles.groupRadioCircle,
                        isSelected && { borderColor: item.color },
                      ]}
                    >
                      {isSelected && (
                        <View
                          style={[styles.groupRadioDot, { backgroundColor: item.color }]}
                        />
                      )}
                    </View>
                  </View>

                  <Text
                    style={[
                      styles.groupCardTitle,
                      isSelected && { color: item.color, fontWeight: '800' },
                    ]}
                  >
                    {item.title}
                  </Text>
                  <Text style={styles.groupCardSubtitle}>{item.subtitle}</Text>
                  <Text style={styles.groupCardDesc}>{item.description}</Text>

                  {isSelected && (
                    <View style={[styles.selectedPill, { backgroundColor: item.color }]}>
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      <Text style={styles.selectedPillText}>Đang chọn</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Chỉ số tóm tắt nhóm đang chọn */}
          <View style={styles.groupSelectedSummary}>
            <Ionicons name="information-circle" size={18} color="#1E56A0" />
            <Text style={styles.groupSelectedSummaryText}>
              Bạn đang chọn: <Text style={{ fontWeight: '700' }}>Nhóm {selectedGroup}</Text> (
              {BUSINESS_GROUPS.find((g) => g.group === selectedGroup)?.subtitle})
            </Text>
          </View>
        </View>

        {/* ======================================================== */}
        {/* MỤC 2: LOẠI HÌNH KINH DOANH (THANH CUỘN & MỤC KHÁC ĐIỀN VÀO) */}
        {/* ======================================================== */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionNumberCircle}>
              <Text style={styles.sectionNumberText}>2</Text>
            </View>
            <View style={styles.sectionHeaderTextCol}>
              <Text style={styles.sectionTitle}>Loại hình kinh doanh</Text>
              <Text style={styles.sectionSubtitle}>
                Thanh cuộn chọn ngành nghề hoặc chọn mục "Khác" để tự điền
              </Text>
            </View>
          </View>

          {/* Thanh cuộn danh sách Loại hình kinh doanh */}
          <ScrollView
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            style={styles.typesScrollBox}
          >
            {BUSINESS_TYPES.map((type) => {
              const isSelected = selectedType === type.id;
              return (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeItemRow,
                    isSelected && styles.typeItemRowSelected,
                  ]}
                  onPress={() => setSelectedType(type.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.typeItemIconBox,
                      isSelected && styles.typeItemIconBoxSelected,
                    ]}
                  >
                    <Ionicons
                      name={type.icon}
                      size={20}
                      color={isSelected ? '#1E56A0' : '#64748B'}
                    />
                  </View>

                  <View style={styles.typeItemTextCol}>
                    <Text
                      style={[
                        styles.typeItemTitle,
                        isSelected && styles.typeItemTitleSelected,
                      ]}
                    >
                      {type.label}
                    </Text>
                    <Text style={styles.typeItemSublabel}>{type.sublabel}</Text>
                  </View>

                  <View
                    style={[
                      styles.typeRadioCircle,
                      isSelected && styles.typeRadioCircleSelected,
                    ]}
                  >
                    {isSelected && <View style={styles.typeRadioDot} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Ô nhập liệu xuất hiện khi user chọn mục "Khác" */}
          {selectedType === 'khac' && (
            <View style={styles.otherInputBox}>
              <View style={styles.otherInputHeader}>
                <Ionicons name="pencil" size={16} color="#1E56A0" />
                <Text style={styles.otherInputLabel}>
                  Điền chi tiết loại hình kinh doanh của bạn <Text style={{ color: '#EF4444' }}>*</Text>
                </Text>
              </View>
              <TextInput
                style={styles.otherTextInput}
                placeholder="Ví dụ: Đại lý vé máy bay, Trung tâm gia sư, Studio ảnh cưới..."
                placeholderTextColor="#94A3B8"
                value={otherTypeText}
                onChangeText={setOtherTypeText}
                autoFocus
              />
              <Text style={styles.otherInputHint}>
                Vui lòng mô tả ngắn gọn ngành nghề hoặc hoạt động kinh doanh chính.
              </Text>
            </View>
          )}

          {/* Tên cơ sở/Hộ kinh doanh (Không bắt buộc) */}
          <View style={styles.businessNameBox}>
            <Text style={styles.businessNameLabel}>
              Tên cửa hàng / Hộ kinh doanh <Text style={{ color: '#94A3B8' }}>(Tùy chọn)</Text>
            </Text>
            <TextInput
              style={styles.businessNameInput}
              placeholder="Ví dụ: Cửa hàng Bách Hóa Minh Tâm"
              placeholderTextColor="#94A3B8"
              value={businessName}
              onChangeText={setBusinessName}
            />
          </View>
        </View>

        {/* ======================================================== */}
        {/* NÚT TIẾP THEO -> CHUYỂN VÀO TRANG CHỦ */}
        {/* ======================================================== */}
        <View style={styles.actionContainer}>
          <CustomButton
            title="Tiếp theo"
            variant="primary"
            loading={isLoading}
            onPress={handleSubmit}
            icon={<Ionicons name="arrow-forward" size={20} color="#FFFFFF" />}
            style={styles.nextBtn}
          />
          <Text style={styles.nextBtnNote}>
            Sau khi ấn "Tiếp theo", bạn sẽ được đưa trực tiếp vào Trang chủ với giao diện quản lý doanh thu, chi phí tương ứng.
          </Text>
        </View>
      </ScrollView>

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
              <Ionicons name="log-out" size={28} color="#DC2626" />
            </View>
            <Text style={styles.logoutModalTitle}>Xác nhận đăng xuất</Text>
            <Text style={styles.logoutModalDesc}>
              Bạn có chắc chắn muốn đăng xuất khỏi tài khoản{' '}
              <Text style={{ fontWeight: '700', color: '#1E293B' }}>{user?.fullName || 'Hộ kinh doanh'}</Text>?
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
    backgroundColor: '#F8FAFC',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitleBox: {
    marginLeft: 10,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E56A0',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  logoutBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
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
    width: 56,
    height: 56,
    borderRadius: 28,
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
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  logoutConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  welcomeCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  welcomeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  welcomeTextBox: {
    flex: 1,
  },
  welcomeGreeting: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A8A',
    marginBottom: 4,
  },
  userNameHighlight: {
    color: '#1E56A0',
    fontWeight: '800',
  },
  welcomeGuide: {
    fontSize: 13,
    color: '#3B82F6',
    lineHeight: 18,
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
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionNumberCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E56A0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionNumberText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  sectionHeaderTextCol: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  groupScrollContainer: {
    paddingVertical: 6,
    gap: 12,
  },
  groupCard: {
    width: 230,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 14,
    position: 'relative',
  },
  groupCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  groupIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupRadioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupRadioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  groupCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  groupCardSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  groupCardDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
  selectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 10,
    gap: 4,
  },
  selectedPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  groupSelectedSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 10,
    marginTop: 14,
    gap: 8,
  },
  groupSelectedSummaryText: {
    fontSize: 12,
    color: '#334155',
    flex: 1,
  },
  typesScrollBox: {
    maxHeight: 280,
  },
  typeItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 10,
  },
  typeItemRowSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  typeItemIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  typeItemIconBoxSelected: {
    backgroundColor: '#DBEAFE',
  },
  typeItemTextCol: {
    flex: 1,
  },
  typeItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  typeItemTitleSelected: {
    color: '#1E56A0',
  },
  typeItemSublabel: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  typeRadioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  typeRadioCircleSelected: {
    borderColor: '#2563EB',
  },
  typeRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
  },
  otherInputBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#93C5FD',
    padding: 14,
    marginTop: 6,
    marginBottom: 12,
  },
  otherInputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  otherInputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  otherTextInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  otherInputHint: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 6,
  },
  businessNameBox: {
    marginTop: 8,
  },
  businessNameLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  businessNameInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  actionContainer: {
    marginTop: 8,
  },
  nextBtn: {
    height: 52,
    borderRadius: 12,
    backgroundColor: '#1E56A0',
  },
  nextBtnNote: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 17,
  },
});
