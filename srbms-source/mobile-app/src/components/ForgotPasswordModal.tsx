import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CustomButton } from './CustomButton';

interface ForgotPasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  visible,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="key-outline" size={32} color="#1E56A0" />
          </View>

          <Text style={styles.title}>Quên mật khẩu?</Text>

          <Text style={styles.message}>
            Hệ thống Quản lý Hộ Kinh Doanh (SRBMS) bảo mật danh tính qua số CCCD.
            {'\n\n'}
            Để khôi phục mật khẩu hoặc đặt lại thông tin truy cập, vui lòng liên hệ trực tiếp với cơ quan quản lý hoặc Quản trị viên hệ thống qua:
          </Text>

          <View style={styles.contactCard}>
            <View style={styles.contactRow}>
              <Ionicons name="call-outline" size={18} color="#1E56A0" />
              <Text style={styles.contactText}>Tổng đài hỗ trợ: 1900 xxxx</Text>
            </View>
            <View style={styles.contactRow}>
              <Ionicons name="mail-outline" size={18} color="#1E56A0" />
              <Text style={styles.contactText}>Email: hotro@hokinhdoanh.gov.vn</Text>
            </View>
          </View>

          <CustomButton
            title="Đã hiểu và Đóng"
            variant="primary"
            onPress={onClose}
            style={{ marginTop: 16 }}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
  },
  contactCard: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  contactText: {
    fontSize: 13,
    color: '#374151',
    marginLeft: 8,
    fontWeight: '500',
  },
});
