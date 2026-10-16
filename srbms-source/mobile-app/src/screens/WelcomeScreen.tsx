import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BrandLogo } from '../components/BrandLogo';
import { CustomButton } from '../components/CustomButton';
import { BottomCurve } from '../components/BottomCurve';
import { ServerConfigModal } from '../components/ServerConfigModal';
import { ForgotPasswordModal } from '../components/ForgotPasswordModal';
import { useAuth } from '../context/AuthContext';

interface WelcomeScreenProps {
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onNavigateToLogin,
  onNavigateToRegister,
}) => {
  const { baseUrl, updateBaseUrl } = useAuth();
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Nút cấu hình Server IP trên góc trên cùng bên phải */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.serverButton}
          onPress={() => setShowServerConfig(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={18} color="#6B7280" />
          <Text style={styles.serverButtonText} numberOfLines={1}>
            {baseUrl.replace('http://', '')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Phần Logo và Khẩu hiệu (Thương hiệu HỘ KINH DOANH) */}
        <View style={styles.logoSection}>
          <BrandLogo size={110} />
        </View>

        {/* Khối các nút hành động tương tự giao diện mẫu */}
        <View style={styles.actionSection}>
          <CustomButton
            title="Đăng nhập"
            variant="primary"
            onPress={onNavigateToLogin}
            style={styles.button}
          />

          <CustomButton
            title="Đăng ký"
            variant="primary"
            onPress={onNavigateToRegister}
            style={styles.button}
          />

          <TouchableOpacity
            style={styles.forgotButton}
            onPress={() => setShowForgotModal(true)}
            activeOpacity={0.6}
          >
            <Text style={styles.forgotText}>Quên mật khẩu?</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Đường cong màu xanh bo tròn viền dưới màn hình theo mẫu */}
      <BottomCurve height={60} color="#4579C7" />

      {/* Modal cấu hình IP máy chủ */}
      <ServerConfigModal
        visible={showServerConfig}
        onClose={() => setShowServerConfig(false)}
        currentUrl={baseUrl}
        onSave={updateBaseUrl}
      />

      {/* Modal hướng dẫn quên mật khẩu */}
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
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    zIndex: 10,
  },
  serverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  serverButtonText: {
    fontSize: 12,
    color: '#4B5563',
    marginLeft: 6,
    fontWeight: '500',
    maxWidth: 160,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 70, // Chừa không gian cho BottomCurve
  },
  logoSection: {
    marginBottom: 44,
    alignItems: 'center',
  },
  actionSection: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  button: {
    height: 48,
    borderRadius: 8,
    backgroundColor: '#4579C7', // Đồng nhất màu xanh chuẩn từ thiết kế
    marginVertical: 7,
  },
  forgotButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  forgotText: {
    color: '#1E56A0',
    fontSize: 15,
    fontWeight: '500',
    textDecorationLine: 'none',
  },
});
