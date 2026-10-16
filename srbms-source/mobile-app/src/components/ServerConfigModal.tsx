import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DEFAULT_DEV_IPS } from '../api/config';
import { authApi } from '../api/authApi';
import { CustomButton } from './CustomButton';

interface ServerConfigModalProps {
  visible: boolean;
  onClose: () => void;
  currentUrl: string;
  onSave: (newUrl: string) => Promise<void>;
}

export const ServerConfigModal: React.FC<ServerConfigModalProps> = ({
  visible,
  onClose,
  currentUrl,
  onSave,
}) => {
  const [url, setUrl] = useState(currentUrl);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      // Tạm lưu url để test
      await onSave(url);
      const isAlive = await authApi.ping();
      if (isAlive) {
        setTestResult({
          ok: true,
          message: 'Kết nối máy chủ Backend thành công!',
        });
      } else {
        setTestResult({
          ok: false,
          message: 'Máy chủ không phản hồi. Hãy kiểm tra Backend Spring Boot (port 8080).',
        });
      }
    } catch (err: any) {
      setTestResult({
        ok: false,
        message: err.message || 'Không thể kết nối đến máy chủ.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleApplyPreset = (presetUrl: string) => {
    setUrl(presetUrl);
    setTestResult(null);
  };

  const handleSaveAndClose = async () => {
    if (!url.trim()) {
      Alert.alert('Lỗi', 'Địa chỉ máy chủ không được để trống');
      return;
    }
    await onSave(url.trim());
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="server-outline" size={22} color="#1E56A0" />
              <Text style={styles.title}>Cấu hình Máy chủ (Backend)</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <Text style={styles.description}>
            Cấu hình địa chỉ IP máy chủ Spring Boot để Mobile App có thể gọi API xác thực (Login & Register).
          </Text>

          <Text style={styles.label}>Địa chỉ Base URL:</Text>
          <TextInput
            value={url}
            onChangeText={(txt) => {
              setUrl(txt);
              setTestResult(null);
            }}
            placeholder="http://192.168.1.5:8080"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />

          <Text style={styles.presetLabel}>Chọn nhanh theo môi trường chạy:</Text>
          <View style={styles.presetRow}>
            <TouchableOpacity
              style={[
                styles.presetBtn,
                url === DEFAULT_DEV_IPS.WIFI_LAN && styles.presetBtnActive,
              ]}
              onPress={() => handleApplyPreset(DEFAULT_DEV_IPS.WIFI_LAN)}
            >
              <Text
                style={[
                  styles.presetText,
                  url === DEFAULT_DEV_IPS.WIFI_LAN && styles.presetTextActive,
                ]}
              >
                Wi-Fi LAN (Máy thật)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.presetBtn,
                url === DEFAULT_DEV_IPS.ANDROID_EMULATOR && styles.presetBtnActive,
              ]}
              onPress={() => handleApplyPreset(DEFAULT_DEV_IPS.ANDROID_EMULATOR)}
            >
              <Text
                style={[
                  styles.presetText,
                  url === DEFAULT_DEV_IPS.ANDROID_EMULATOR && styles.presetTextActive,
                ]}
              >
                Android Emulator
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.presetBtn,
                url === DEFAULT_DEV_IPS.IOS_OR_WEB && styles.presetBtnActive,
              ]}
              onPress={() => handleApplyPreset(DEFAULT_DEV_IPS.IOS_OR_WEB)}
            >
              <Text
                style={[
                  styles.presetText,
                  url === DEFAULT_DEV_IPS.IOS_OR_WEB && styles.presetTextActive,
                ]}
              >
                iOS / Localhost
              </Text>
            </TouchableOpacity>
          </View>

          {testResult && (
            <View
              style={[
                styles.resultBox,
                testResult.ok ? styles.resultSuccess : styles.resultError,
              ]}
            >
              <Ionicons
                name={testResult.ok ? 'checkmark-circle' : 'alert-circle'}
                size={18}
                color={testResult.ok ? '#10B981' : '#EF4444'}
              />
              <Text
                style={[
                  styles.resultText,
                  { color: testResult.ok ? '#065F46' : '#991B1B' },
                ]}
              >
                {testResult.message}
              </Text>
            </View>
          )}

          <View style={styles.actions}>
            <CustomButton
              title={isTesting ? 'Đang kiểm tra...' : 'Kiểm tra kết nối (Ping)'}
              variant="outline"
              loading={isTesting}
              onPress={handleTestConnection}
              style={{ flex: 1, marginRight: 8 }}
            />
            <CustomButton
              title="Lưu cấu hình"
              variant="primary"
              onPress={handleSaveAndClose}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E56A0',
    marginLeft: 8,
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.2,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: '#111827',
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
  },
  presetLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  presetBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  presetBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B72C4',
  },
  presetText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  presetTextActive: {
    color: '#1E56A0',
    fontWeight: '700',
  },
  resultBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  resultSuccess: {
    backgroundColor: '#D1FAE5',
  },
  resultError: {
    backgroundColor: '#FEE2E2',
  },
  resultText: {
    fontSize: 12,
    marginLeft: 6,
    flex: 1,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 6,
  },
});
