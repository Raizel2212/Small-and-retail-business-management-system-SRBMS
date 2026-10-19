import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from '../components/BrandLogo';
import { ServerConfigModal } from '../components/ServerConfigModal';

type BottomTabType = 'home' | 'search' | 'camera' | 'profile' | 'settings';

export interface HomeScreenProps {
  onNavigateToRevenueDetail?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigateToRevenueDetail }) => {
  const { user, token, logout, baseUrl, updateBaseUrl } = useAuth();

  const [activeTab, setActiveTab] = useState<BottomTabType>('home');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<'month' | 'quarter' | 'year'>('month');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Notifications mock data
  const notifications = [
    {
      id: '1',
      title: 'Hồ sơ Hộ kinh doanh đã kích hoạt',
      time: '10 phút trước',
      desc: `Bạn đang được phân loại vào Hộ kinh doanh Nhóm ${user?.businessGroup || 1} - ${user?.businessType || 'Thương mại'}.`,
      icon: 'checkmark-circle-outline' as const,
      color: '#10B981',
    },
    {
      id: '2',
      title: 'Nhắc nhở kê khai quý',
      time: '2 giờ trước',
      desc: 'Hệ thống đã tự động tính toán số liệu doanh thu và chi phí kỳ này.',
      icon: 'calendar-outline' as const,
      color: '#3B82F6',
    },
    {
      id: '3',
      title: 'Phiên đăng nhập an toàn',
      time: 'Hôm nay',
      desc: `Đăng nhập thành công với CCCD: ${user?.cccd}.`,
      icon: 'shield-checkmark-outline' as const,
      color: '#8B5CF6',
    },
  ];

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  // Render tab "Trang chủ"
  const renderHomeContent = () => (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Thông tin Hộ kinh doanh & Bộ lọc thời gian */}
      <View style={styles.businessBadgeCard}>
        <View style={styles.businessBadgeLeft}>
          <View style={styles.businessIconBadge}>
            <Ionicons name="storefront" size={20} color="#1E56A0" />
          </View>
          <View style={styles.businessInfoCol}>
            <Text style={styles.businessNameText} numberOfLines={1}>
              {user?.businessName || 'HỘ KINH DOANH CÁ THỂ'}
            </Text>
            <View style={styles.badgeRow}>
              <View style={styles.groupPill}>
                <Text style={styles.groupPillText}>
                  Nhóm {user?.businessGroup || 1}
                </Text>
              </View>
              <View style={styles.typePill}>
                <Text style={styles.typePillText}>
                  {user?.businessType || 'Thương mại'}
                  {user?.otherBusinessType ? ` (${user.otherBusinessType})` : ''}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bộ lọc thời gian */}
        <View style={styles.periodPicker}>
          <TouchableOpacity
            style={[styles.periodBtn, periodFilter === 'month' && styles.periodBtnActive]}
            onPress={() => setPeriodFilter('month')}
          >
            <Text
              style={[
                styles.periodBtnText,
                periodFilter === 'month' && styles.periodBtnTextActive,
              ]}
            >
              Tháng
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodBtn, periodFilter === 'quarter' && styles.periodBtnActive]}
            onPress={() => setPeriodFilter('quarter')}
          >
            <Text
              style={[
                styles.periodBtnText,
                periodFilter === 'quarter' && styles.periodBtnTextActive,
              ]}
            >
              Quý
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodBtn, periodFilter === 'year' && styles.periodBtnActive]}
            onPress={() => setPeriodFilter('year')}
          >
            <Text
              style={[
                styles.periodBtnText,
                periodFilter === 'year' && styles.periodBtnTextActive,
              ]}
            >
              Năm
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ======================================================== */}
      {/* 3 MỤC CHÍNH THEO YÊU CẦU: DOANH THU, CHI PHÍ, TỔNG HỢP */}
      {/* ======================================================== */}

      {/* 1. MỤC DOANH THU */}
      <View style={styles.financeCard}>
        <View style={styles.financeCardHeader}>
          <View style={styles.financeHeaderLeft}>
            <View style={[styles.financeIconCircle, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="trending-up" size={22} color="#059669" />
            </View>
            <View>
              <Text style={styles.financeCardLabel}>MỤC 1</Text>
              <Text style={styles.financeCardTitle}>DOANH THU</Text>
            </View>
          </View>
          <View style={styles.growthBadgeGreen}>
            <Ionicons name="arrow-up" size={13} color="#059669" />
            <Text style={styles.growthBadgeGreenText}>+14.8%</Text>
          </View>
        </View>

        {/* Số tiền Doanh thu */}
        <View style={styles.amountContainer}>
          <Text style={styles.amountNumber}>158.420.000</Text>
          <Text style={styles.currencySymbol}>₫</Text>
        </View>
        <Text style={styles.amountSubtext}>
          Tổng thu thực tế trong kỳ ({periodFilter === 'month' ? 'Tháng này' : periodFilter === 'quarter' ? 'Quý này' : 'Năm nay'})
        </Text>

        {/* Chi tiết mục Doanh thu */}
        <View style={styles.breakdownBox}>
          <View style={styles.breakdownItem}>
            <View style={styles.breakdownDotGreen} />
            <Text style={styles.breakdownLabel}>Bán buôn, bán lẻ trực tiếp:</Text>
            <Text style={styles.breakdownValue}>124.600.000 ₫</Text>
          </View>
          <View style={styles.breakdownDivider} />
          <View style={styles.breakdownItem}>
            <View style={styles.breakdownDotGreen} />
            <Text style={styles.breakdownLabel}>Bán qua mạng & giao hàng:</Text>
            <Text style={styles.breakdownValue}>33.820.000 ₫</Text>
          </View>
          <View style={styles.breakdownDivider} />
          <View style={styles.breakdownItem}>
            <View style={styles.breakdownDotGreen} />
            <Text style={styles.breakdownLabel}>Tổng số hóa đơn / đơn bán:</Text>
            <Text style={styles.breakdownValueBold}>342 đơn</Text>
          </View>
        </View>

        {/* Thao tác nhanh cho Doanh thu */}
        <View style={styles.cardActionsRow}>
          <TouchableOpacity
            style={[styles.cardActionBtn, { backgroundColor: '#ECFDF5' }]}
            onPress={() => {
              if (onNavigateToRevenueDetail) {
                onNavigateToRevenueDetail();
              } else {
                Alert.alert('Tạo đơn bán', 'Chức năng thêm đơn bán hàng mới');
              }
            }}
          >
            <Ionicons name="add-circle-outline" size={18} color="#059669" />
            <Text style={[styles.cardActionBtnText, { color: '#059669' }]}>+ Thêm hóa đơn</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cardDetailBtn}
            onPress={() => {
              if (onNavigateToRevenueDetail) {
                onNavigateToRevenueDetail();
              } else {
                Alert.alert('Sổ doanh thu', 'Xem toàn bộ lịch sử bán hàng');
              }
            }}
          >
            <Text style={styles.cardDetailBtnText}>Chi tiết doanh thu</Text>
            <Ionicons name="chevron-forward" size={14} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. MỤC CHI PHÍ */}
      <View style={styles.financeCard}>
        <View style={styles.financeCardHeader}>
          <View style={styles.financeHeaderLeft}>
            <View style={[styles.financeIconCircle, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="trending-down" size={22} color="#DC2626" />
            </View>
            <View>
              <Text style={styles.financeCardLabel}>MỤC 2</Text>
              <Text style={styles.financeCardTitle}>CHI PHÍ</Text>
            </View>
          </View>
          <View style={styles.ratioBadgeRed}>
            <Text style={styles.ratioBadgeRedText}>39.2% doanh thu</Text>
          </View>
        </View>

        {/* Số tiền Chi phí */}
        <View style={styles.amountContainer}>
          <Text style={[styles.amountNumber, { color: '#DC2626' }]}>62.150.000</Text>
          <Text style={[styles.currencySymbol, { color: '#DC2626' }]}>₫</Text>
        </View>
        <Text style={styles.amountSubtext}>
          Tổng chi phí vận hành và giá vốn hàng bán trong kỳ
        </Text>

        {/* Chi tiết mục Chi phí */}
        <View style={styles.breakdownBox}>
          <View style={styles.breakdownItem}>
            <View style={styles.breakdownDotRed} />
            <Text style={styles.breakdownLabel}>Giá vốn hàng hóa nhập kho:</Text>
            <Text style={styles.breakdownValue}>45.800.000 ₫</Text>
          </View>
          <View style={styles.breakdownDivider} />
          <View style={styles.breakdownItem}>
            <View style={styles.breakdownDotRed} />
            <Text style={styles.breakdownLabel}>Mặt bằng, điện nước, mạng:</Text>
            <Text style={styles.breakdownValue}>10.500.000 ₫</Text>
          </View>
          <View style={styles.breakdownDivider} />
          <View style={styles.breakdownItem}>
            <View style={styles.breakdownDotRed} />
            <Text style={styles.breakdownLabel}>Nhân công & chi phí phụ trợ:</Text>
            <Text style={styles.breakdownValue}>5.850.000 ₫</Text>
          </View>
        </View>

        {/* Thao tác nhanh cho Chi phí */}
        <View style={styles.cardActionsRow}>
          <TouchableOpacity
            style={[styles.cardActionBtn, { backgroundColor: '#FEF2F2' }]}
            onPress={() => Alert.alert('Ghi nhận chi phí', 'Nhập khoản chi mua hàng hoặc vận hành')}
          >
            <Ionicons name="receipt-outline" size={18} color="#DC2626" />
            <Text style={[styles.cardActionBtnText, { color: '#DC2626' }]}>+ Ghi khoản chi</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cardDetailBtn}
            onPress={() => Alert.alert('Sổ chi phí', 'Xem toàn bộ chứng từ chi phí')}
          >
            <Text style={styles.cardDetailBtnText}>Chi tiết chi phí</Text>
            <Ionicons name="chevron-forward" size={14} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. MỤC TỔNG HỢP */}
      <View style={[styles.financeCard, styles.summaryCardBorder]}>
        <View style={styles.financeCardHeader}>
          <View style={styles.financeHeaderLeft}>
            <View style={[styles.financeIconCircle, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="pie-chart" size={22} color="#1E56A0" />
            </View>
            <View>
              <Text style={styles.financeCardLabel}>MỤC 3</Text>
              <Text style={styles.financeCardTitle}>TỔNG HỢP KẾT QUẢ</Text>
            </View>
          </View>
          <View style={styles.summaryBadgeBlue}>
            <Text style={styles.summaryBadgeBlueText}>Lợi nhuận ròng</Text>
          </View>
        </View>

        {/* Lợi nhuận = Doanh thu - Chi phí */}
        <View style={styles.amountContainer}>
          <Text style={[styles.amountNumber, { color: '#1E56A0' }]}>96.270.000</Text>
          <Text style={[styles.currencySymbol, { color: '#1E56A0' }]}>₫</Text>
        </View>
        <Text style={styles.amountSubtext}>
          Lợi nhuận thuần = Doanh thu (158.420.000 ₫) - Chi phí (62.150.000 ₫)
        </Text>

        {/* Biểu đồ thanh tỷ lệ Doanh thu vs Chi phí */}
        <View style={styles.barProgressBox}>
          <View style={styles.barProgressRow}>
            <Text style={styles.barProgressLabel}>Tỷ trọng Chi phí / Doanh thu</Text>
            <Text style={styles.barProgressValue}>60.8% Tỷ suất lợi nhuận</Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFillProfit, { width: '60.8%' }]} />
            <View style={[styles.progressBarFillExpense, { width: '39.2%' }]} />
          </View>
        </View>

        {/* Đánh giá nghĩa vụ thuế dự kiến theo nhóm đã chọn */}
        <View style={styles.taxEstimateCard}>
          <View style={styles.taxEstimateHeader}>
            <Ionicons name="calculator" size={16} color="#4338CA" />
            <Text style={styles.taxEstimateTitle}>
              Ước tính nghĩa vụ thuế (Hộ KD Nhóm {user?.businessGroup || 1}):
            </Text>
          </View>
          <Text style={styles.taxEstimateDesc}>
            {user?.businessGroup === 1
              ? '• Hộ KD Nhóm 1 (Doanh thu < 100 tr/năm): Miễn thuế GTGT, TNCN & môn bài.'
              : user?.businessGroup === 2
              ? '• Hộ KD Nhóm 2: Thuế khoán ước tính theo tỷ lệ ngành Thương mại (1% GTGT + 0.5% TNCN).'
              : '• Hộ KD Nhóm 3: Kê khai doanh thu thực tế và sử dụng Hóa đơn điện tử có mã CQT.'}
          </Text>
        </View>

        {/* Thao tác nhanh cho Tổng hợp */}
        <View style={styles.cardActionsRow}>
          <TouchableOpacity
            style={[styles.cardActionBtn, { backgroundColor: '#EFF6FF', flex: 1 }]}
            onPress={() => Alert.alert('Báo cáo thuế', 'Xuất báo cáo tổng hợp tờ khai thuế')}
          >
            <Ionicons name="document-text-outline" size={18} color="#1E56A0" />
            <Text style={[styles.cardActionBtnText, { color: '#1E56A0' }]}>Xuất báo cáo thuế</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  // Render tab "Tìm kiếm"
  const renderSearchContent = () => (
    <View style={styles.tabContentContainer}>
      <View style={styles.searchBarBox}>
        <Ionicons name="search" size={20} color="#64748B" />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm hóa đơn, mã chứng từ, mặt hàng, khách hàng..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        <Text style={styles.recentSearchTitle}>Tìm kiếm gần đây</Text>
        {['Hóa đơn bán lẻ HD00234', 'Tiền điện nước tháng này', 'Phiếu nhập kho gạo ST25', 'Khách hàng Minh Anh'].map(
          (item, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.recentSearchItem}
              onPress={() => setSearchQuery(item)}
            >
              <Ionicons name="time-outline" size={18} color="#64748B" />
              <Text style={styles.recentSearchText}>{item}</Text>
              <Ionicons name="arrow-undo-outline" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )
        )}
      </ScrollView>
    </View>
  );

  // Render tab "Chụp ảnh" (Quét hóa đơn / OCR chứng từ)
  const renderCameraContent = () => (
    <View style={styles.tabContentContainer}>
      <View style={styles.cameraBox}>
        <View style={styles.cameraFrame}>
          <Ionicons name="scan-outline" size={120} color="#1E56A0" />
          <Text style={styles.cameraScanTitle}>Chụp ảnh Hóa đơn & Chứng từ</Text>
          <Text style={styles.cameraScanSubtitle}>
            Hệ thống OCR sẽ tự động đọc số tiền, mã số thuế và ghi nhận vào Doanh thu / Chi phí của Hộ kinh doanh.
          </Text>

          <TouchableOpacity
            style={styles.cameraTriggerBtn}
            onPress={() => Alert.alert('Chụp ảnh', 'Đã chụp và nhận diện hóa đơn tự động thành công!')}
          >
            <Ionicons name="camera" size={26} color="#FFFFFF" />
            <Text style={styles.cameraTriggerBtnText}>Chụp ảnh hóa đơn</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cameraGalleryBtn}
            onPress={() => Alert.alert('Chọn ảnh', 'Mở thư viện ảnh để tải lên hóa đơn')}
          >
            <Ionicons name="images-outline" size={18} color="#1E56A0" />
            <Text style={styles.cameraGalleryBtnText}>Chọn ảnh từ thư viện</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Render tab "Profile"
  const renderProfileContent = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.fullName || 'Chủ hộ kinh doanh'}</Text>
          <Text style={styles.profileCccd}>Số CCCD: {user?.cccd}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.statusBadge}>
              <Ionicons name="checkmark-circle" size={13} color="#10B981" />
              <Text style={styles.statusBadgeText}>{user?.status || 'ACTIVE'}</Text>
            </View>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{user?.role || 'ROLE_USER'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Thông tin Hộ kinh doanh */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="business-outline" size={20} color="#1E56A0" />
          <Text style={styles.sectionTitle}>Thông tin Hộ kinh doanh</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Nhóm hộ kinh doanh:</Text>
          <Text style={styles.infoValueBold}>Nhóm {user?.businessGroup || 1}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Loại hình kinh doanh:</Text>
          <Text style={styles.infoValueBold}>{user?.businessType || 'Thương mại'}</Text>
        </View>
        {user?.otherBusinessType ? (
          <>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ngành nghề chi tiết:</Text>
              <Text style={styles.infoValue}>{user.otherBusinessType}</Text>
            </View>
          </>
        ) : null}
        {user?.businessName ? (
          <>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tên hộ KD / Cửa hàng:</Text>
              <Text style={styles.infoValue}>{user.businessName}</Text>
            </View>
          </>
        ) : null}
      </View>

      {/* Thông tin liên hệ & định danh */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="id-card-outline" size={20} color="#1E56A0" />
          <Text style={styles.sectionTitle}>Định danh & Liên hệ</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Số CCCD:</Text>
          <Text style={styles.infoValue}>{user?.cccd}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Số điện thoại:</Text>
          <Text style={styles.infoValue}>{user?.sdt}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>{user?.email}</Text>
        </View>
      </View>

      {/* Nút Đăng xuất tài khoản trong Profile */}
      <TouchableOpacity
        style={styles.profileLogoutBtn}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <View style={styles.profileLogoutIconBox}>
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
        </View>
        <View style={styles.profileLogoutTextBox}>
          <Text style={styles.profileLogoutText}>Đăng xuất khỏi tài khoản</Text>
          <Text style={styles.profileLogoutSubtext}>Thoát phiên đăng nhập an toàn</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#EF4444" />
      </TouchableOpacity>
    </ScrollView>
  );

  // Render tab "Setting"
  const renderSettingContent = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="server-outline" size={20} color="#1E56A0" />
          <Text style={styles.sectionTitle}>Cấu hình kết nối Backend</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Địa chỉ API Server:</Text>
          <Text style={styles.infoValueBold}>{baseUrl}</Text>
        </View>
        <TouchableOpacity
          style={styles.settingActionBtn}
          onPress={() => setShowServerConfig(true)}
        >
          <Ionicons name="pencil" size={16} color="#1E56A0" />
          <Text style={styles.settingActionBtnText}>Đổi địa chỉ Server Backend</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="information-circle-outline" size={20} color="#1E56A0" />
          <Text style={styles.sectionTitle}>Thông tin ứng dụng</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phiên bản phần mềm:</Text>
          <Text style={styles.infoValue}>1.0.0 (Release 2026)</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Hệ thống:</Text>
          <Text style={styles.infoValue}>SRBMS - Quản lý Hộ Kinh Doanh</Text>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* ======================================================== */}
      {/* HEADER:
          - Tên user ở góc trên cùng bên trái
          - Ở giữa là Logo của App
          - Bên phải là Icon chuông thông báo
      {/* ======================================================== */}
      <View style={styles.headerBar}>
        {/* Góc trên cùng bên trái: Tên User (Chạm để tới Profile) */}
        <TouchableOpacity
          style={styles.headerLeftUser}
          onPress={() => setActiveTab('profile')}
          activeOpacity={0.7}
        >
          <View style={styles.userMiniAvatar}>
            <Text style={styles.userMiniAvatarText}>
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          <View style={styles.userNameCol}>
            <Text style={styles.userGreeting}>Xin chào,</Text>
            <Text style={styles.userNameText} numberOfLines={1}>
              {user?.fullName || 'Người dùng'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Ở giữa: Logo của App */}
        <View style={styles.headerCenterLogo}>
          <BrandLogo size={36} showText={false} />
        </View>

        {/* Bên phải: Icon chuông thông báo */}
        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => setShowNotificationModal(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="notifications-outline" size={24} color="#1E293B" />
            <View style={styles.bellBadgeDot} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ======================================================== */}
      {/* NỘI DUNG BODY DỰA THEO TAB ĐANG CHỌN */}
      {/* ======================================================== */}
      <View style={styles.mainBody}>
        {activeTab === 'home' && renderHomeContent()}
        {activeTab === 'search' && renderSearchContent()}
        {activeTab === 'camera' && renderCameraContent()}
        {activeTab === 'profile' && renderProfileContent()}
        {activeTab === 'settings' && renderSettingContent()}
      </View>

      {/* ======================================================== */}
      {/* BOTTOM NAVIGATION:
          Icon từ trái sang phải: Trang chủ, Tìm kiếm, Chụp ảnh, Profile, Setting
      {/* ======================================================== */}
      <View style={styles.bottomNav}>
        {/* 1. Trang chủ */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('home')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'home' ? 'home' : 'home-outline'}
            size={24}
            color={activeTab === 'home' ? '#1E56A0' : '#94A3B8'}
          />
          <Text
            style={[
              styles.navLabel,
              activeTab === 'home' && styles.navLabelActive,
            ]}
          >
            Trang chủ
          </Text>
        </TouchableOpacity>

        {/* 2. Tìm kiếm */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('search')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'search' ? 'search' : 'search-outline'}
            size={24}
            color={activeTab === 'search' ? '#1E56A0' : '#94A3B8'}
          />
          <Text
            style={[
              styles.navLabel,
              activeTab === 'search' && styles.navLabelActive,
            ]}
          >
            Tìm kiếm
          </Text>
        </TouchableOpacity>

        {/* 3. Chụp ảnh (Nút nổi bật quét hóa đơn OCR) */}
        <TouchableOpacity
          style={styles.navItemCamera}
          onPress={() => setActiveTab('camera')}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.cameraCircleBtn,
              activeTab === 'camera' && styles.cameraCircleBtnActive,
            ]}
          >
            <Ionicons name="camera" size={26} color="#FFFFFF" />
          </View>
          <Text
            style={[
              styles.navLabel,
              activeTab === 'camera' && styles.navLabelActive,
            ]}
          >
            Chụp ảnh
          </Text>
        </TouchableOpacity>

        {/* 4. Profile */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('profile')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'profile' ? 'person' : 'person-outline'}
            size={24}
            color={activeTab === 'profile' ? '#1E56A0' : '#94A3B8'}
          />
          <Text
            style={[
              styles.navLabel,
              activeTab === 'profile' && styles.navLabelActive,
            ]}
          >
            Profile
          </Text>
        </TouchableOpacity>

        {/* 5. Setting */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('settings')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'settings' ? 'settings' : 'settings-outline'}
            size={24}
            color={activeTab === 'settings' ? '#1E56A0' : '#94A3B8'}
          />
          <Text
            style={[
              styles.navLabel,
              activeTab === 'settings' && styles.navLabelActive,
            ]}
          >
            Setting
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modal Thông báo */}
      <Modal
        visible={showNotificationModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNotificationModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowNotificationModal(false)}
        >
          <View style={styles.notificationModalBox}>
            <View style={styles.notificationModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="notifications" size={22} color="#1E56A0" />
                <Text style={styles.notificationModalTitle}>Thông báo mới</Text>
              </View>
              <TouchableOpacity onPress={() => setShowNotificationModal(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 320 }}>
              {notifications.map((item) => (
                <View key={item.id} style={styles.notificationItem}>
                  <View style={[styles.notificationIconCircle, { backgroundColor: item.color + '1A' }]}>
                    <Ionicons name={item.icon} size={20} color={item.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.notifTitle}>{item.title}</Text>
                    <Text style={styles.notifDesc}>{item.desc}</Text>
                    <Text style={styles.notifTime}>{item.time}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

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

            <View style={styles.logoutAccountCard}>
              <View style={styles.logoutAvatarMini}>
                <Text style={styles.logoutAvatarText}>
                  {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.logoutAccountName} numberOfLines={1}>
                  {user?.fullName || 'Chủ hộ kinh doanh'}
                </Text>
                <Text style={styles.logoutAccountCccd}>Số CCCD: {user?.cccd}</Text>
                {user?.email ? (
                  <Text style={styles.logoutAccountEmail} numberOfLines={1}>
                    {user.email}
                  </Text>
                ) : null}
              </View>
            </View>

            <View style={styles.logoutModalBtnRow}>
              <TouchableOpacity
                style={styles.logoutCancelBtn}
                onPress={() => setShowLogoutModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.logoutCancelText}>Hủy bỏ</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.logoutConfirmBtn}
                onPress={async () => {
                  setShowLogoutModal(false);
                  await logout();
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
                <Text style={styles.logoutConfirmText}>Đăng xuất</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
    backgroundColor: '#F8FAFC',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeftUser: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userMiniAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E56A0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  userMiniAvatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  userNameCol: {
    maxWidth: 120,
  },
  userGreeting: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  userNameText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerCenterLogo: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRightActions: {
    flex: 1,
    alignItems: 'flex-end',
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellBadgeDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  mainBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 96,
  },
  businessBadgeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  businessBadgeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  businessIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  businessInfoCol: {
    flex: 1,
  },
  businessNameText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  groupPill: {
    backgroundColor: '#1E56A0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  groupPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  typePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typePillText: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '600',
  },
  periodPicker: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 2,
  },
  periodBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  periodBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  periodBtnText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  periodBtnTextActive: {
    color: '#1E56A0',
    fontWeight: '700',
  },
  financeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryCardBorder: {
    borderColor: '#BFDBFE',
    backgroundColor: '#FFFFFF',
  },
  financeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  financeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  financeIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  financeCardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  financeCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  growthBadgeGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 2,
  },
  growthBadgeGreenText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '700',
  },
  ratioBadgeRed: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratioBadgeRedText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '700',
  },
  summaryBadgeBlue: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  summaryBadgeBlueText: {
    color: '#1E56A0',
    fontSize: 11,
    fontWeight: '700',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  amountNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: '#059669',
    letterSpacing: -0.5,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
    marginLeft: 4,
  },
  amountSubtext: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
  },
  breakdownBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  breakdownDotGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
    marginRight: 8,
  },
  breakdownDotRed: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#DC2626',
    marginRight: 8,
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#475569',
    flex: 1,
  },
  breakdownValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  breakdownValueBold: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E56A0',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  cardActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 4,
  },
  cardDetailBtnText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  barProgressBox: {
    marginBottom: 14,
  },
  barProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  barProgressLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  barProgressValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E56A0',
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  progressBarFillProfit: {
    backgroundColor: '#1E56A0',
    height: '100%',
  },
  progressBarFillExpense: {
    backgroundColor: '#F87171',
    height: '100%',
  },
  taxEstimateCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  taxEstimateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  taxEstimateTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3730A3',
  },
  taxEstimateDesc: {
    fontSize: 11,
    color: '#4338CA',
    lineHeight: 16,
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 8,
    position: 'relative',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  navItemCamera: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginTop: -16,
  },
  cameraCircleBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E56A0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E56A0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 2,
  },
  cameraCircleBtnActive: {
    backgroundColor: '#2563EB',
    transform: [{ scale: 1.05 }],
  },
  navLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 2,
  },
  navLabelActive: {
    color: '#1E56A0',
    fontWeight: '800',
  },
  tabContentContainer: {
    flex: 1,
    padding: 16,
  },
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  recentSearchTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 10,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  recentSearchText: {
    fontSize: 13,
    color: '#1E293B',
    flex: 1,
  },
  cameraBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  cameraFrame: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  cameraScanTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E56A0',
    marginTop: 16,
    marginBottom: 6,
    textAlign: 'center',
  },
  cameraScanSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  cameraTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E56A0',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 10,
  },
  cameraTriggerBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  cameraGalleryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  cameraGalleryBtnText: {
    color: '#1E56A0',
    fontSize: 13,
    fontWeight: '600',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1E56A0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  profileCccd: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  statusBadgeText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '700',
  },
  roleBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleBadgeText: {
    color: '#1E56A0',
    fontSize: 10,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  infoValue: {
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '500',
  },
  infoValueBold: {
    fontSize: 12,
    color: '#1E56A0',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  profileLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.2,
    borderColor: '#FECACA',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 12,
    marginBottom: 20,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  profileLogoutIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileLogoutTextBox: {
    flex: 1,
    marginLeft: 12,
  },
  profileLogoutText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '700',
  },
  profileLogoutSubtext: {
    color: '#EF4444',
    fontSize: 11,
    marginTop: 2,
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
    marginBottom: 14,
  },
  logoutAccountCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 10,
    marginBottom: 18,
  },
  logoutAvatarMini: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1E56A0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  logoutAccountName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  logoutAccountCccd: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  logoutAccountEmail: {
    fontSize: 11,
    color: '#1E56A0',
    marginTop: 1,
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
  settingActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    marginTop: 10,
  },
  settingActionBtnText: {
    color: '#1E56A0',
    fontSize: 13,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notificationModalBox: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  notificationModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  notificationModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    gap: 12,
  },
  notificationIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  notifDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 4,
  },
  notifTime: {
    fontSize: 10,
    color: '#94A3B8',
  },
});
