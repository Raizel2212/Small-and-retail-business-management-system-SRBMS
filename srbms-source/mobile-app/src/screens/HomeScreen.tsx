import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from '../components/BrandLogo';
import { CustomButton } from '../components/CustomButton';
import { ServerConfigModal } from '../components/ServerConfigModal';

export const HomeScreen: React.FC = () => {
  const { user, token, logout, baseUrl, updateBaseUrl } = useAuth();
  const [showToken, setShowToken] = useState(false);
  const [showServerConfig, setShowServerConfig] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Xác nhận đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Header Top Bar */}
      <View style={styles.headerBar}>
        <View style={styles.brandRow}>
          <BrandLogo size={36} showText={false} />
          <View style={styles.brandTextCol}>
            <Text style={styles.brandTitle}>HỘ KINH DOANH</Text>
            <Text style={styles.brandSubtitle}>SRBMS SYSTEM</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.serverIconBtn}
            onPress={() => setShowServerConfig(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="server-outline" size={20} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutIconBtn}
            onPress={handleLogout}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.fullName || 'Người dùng'}</Text>
            <Text style={styles.profileCccd}>CCCD: {user?.cccd}</Text>
            
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

        {/* Thông tin chi tiết chủ hộ */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="id-card-outline" size={20} color="#1E56A0" />
            <Text style={styles.sectionTitle}>Thông tin chủ hộ & Liên hệ</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Số CCCD (Định danh):</Text>
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

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tên đăng nhập:</Text>
            <Text style={styles.infoValue}>{user?.username || user?.cccd}</Text>
          </View>

          {user?.dateOfBirth && (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ngày sinh:</Text>
                <Text style={styles.infoValue}>{user.dateOfBirth}</Text>
              </View>
            </>
          )}
        </View>

        {/* Thông tin JWT Token & Xác thực an toàn */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#1E56A0" />
            <Text style={styles.sectionTitle}>Phiên bảo mật JWT (Stateless)</Text>
          </View>

          <View style={styles.tokenMetaRow}>
            <Text style={styles.tokenMetaLabel}>Loại Token:</Text>
            <Text style={styles.tokenMetaVal}>Bearer Token (HMAC-SHA256)</Text>
          </View>

          <View style={styles.tokenMetaRow}>
            <Text style={styles.tokenMetaLabel}>Thời hạn phiên:</Text>
            <Text style={styles.tokenMetaVal}>24 giờ (86.400.000 ms)</Text>
          </View>

          <View style={styles.tokenBox}>
            <View style={styles.tokenBoxHeader}>
              <Text style={styles.tokenBoxTitle}>Chuỗi JWT Access Token:</Text>
              <TouchableOpacity onPress={() => setShowToken(!showToken)}>
                <Text style={styles.tokenToggleText}>{showToken ? 'Ẩn' : 'Hiện'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.tokenString} numberOfLines={showToken ? 10 : 2}>
              {token || 'Không có token'}
            </Text>
          </View>
        </View>

        {/* Tiện ích Quản lý Nghiệp vụ */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="grid-outline" size={20} color="#1E56A0" />
            <Text style={styles.sectionTitle}>Chức năng Hộ Kinh Doanh</Text>
          </View>

          <View style={styles.featureGrid}>
            <TouchableOpacity style={styles.featureItem} activeOpacity={0.7}>
              <View style={[styles.featureIconBox, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="storefront-outline" size={22} color="#1E56A0" />
              </View>
              <Text style={styles.featureLabel}>Hộ Kinh Doanh</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.featureItem} activeOpacity={0.7}>
              <View style={[styles.featureIconBox, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="receipt-outline" size={22} color="#16A34A" />
              </View>
              <Text style={styles.featureLabel}>Kê khai Thuế</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.featureItem} activeOpacity={0.7}>
              <View style={[styles.featureIconBox, { backgroundColor: '#FFF7ED' }]}>
                <Ionicons name="trending-up-outline" size={22} color="#EA580C" />
              </View>
              <Text style={styles.featureLabel}>Báo cáo DS</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.featureItem} activeOpacity={0.7}>
              <View style={[styles.featureIconBox, { backgroundColor: '#FAF5FF' }]}>
                <Ionicons name="document-text-outline" size={22} color="#9333EA" />
              </View>
              <Text style={styles.featureLabel}>Hóa đơn GTGT</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Nút Đăng xuất */}
        <CustomButton
          title="Đăng xuất khỏi tài khoản"
          variant="outline"
          onPress={handleLogout}
          icon={<Ionicons name="log-out-outline" size={18} color="#4579C7" />}
          style={styles.logoutBtn}
        />
      </ScrollView>

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
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTextCol: {
    marginLeft: 10,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E56A0',
  },
  brandSubtitle: {
    fontSize: 9,
    fontWeight: '700',
    color: '#EA580C',
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  serverIconBtn: {
    padding: 6,
  },
  logoutIconBtn: {
    padding: 6,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#1E56A0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  profileCccd: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#065F46',
    marginLeft: 4,
  },
  roleBadge: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E56A0',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    maxWidth: '60%',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  tokenMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  tokenMetaLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  tokenMetaVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E56A0',
  },
  tokenBox: {
    marginTop: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tokenBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tokenBoxTitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  tokenToggleText: {
    fontSize: 11,
    color: '#1E56A0',
    fontWeight: '700',
  },
  tokenString: {
    fontSize: 11,
    color: '#334155',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  featureGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  featureItem: {
    alignItems: 'center',
    width: '23%',
  },
  featureIconBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  featureLabel: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
    textAlign: 'center',
  },
  logoutBtn: {
    marginTop: 8,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
});
