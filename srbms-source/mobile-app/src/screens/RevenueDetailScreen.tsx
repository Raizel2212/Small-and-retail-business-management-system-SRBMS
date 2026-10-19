import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { revenueApi } from '../api/revenueApi';
import { RevenueSummary, RevenueItem, CreateRevenuePayload } from '../types/revenue';

interface RevenueDetailScreenProps {
  onBack: () => void;
}

type PeriodType = 'month' | 'quarter' | 'year' | 'all';

export const RevenueDetailScreen: React.FC<RevenueDetailScreenProps> = ({ onBack }) => {
  // State
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [summaryData, setSummaryData] = useState<RevenueSummary | null>(null);
  const [period, setPeriod] = useState<PeriodType>('month');

  // Modals
  const [showPeriodModal, setShowPeriodModal] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<RevenueItem | null>(null);
  const [showActionModal, setShowActionModal] = useState<boolean>(false);

  // Form state for creating new revenue entry
  const [formCustomerName, setFormCustomerName] = useState<string>('');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formDate, setFormDate] = useState<string>('');
  const [formPaymentMethod, setFormPaymentMethod] = useState<'TIEN_MAT' | 'CHUYEN_KHOAN'>('TIEN_MAT');
  const [formPaymentStatus, setFormPaymentStatus] = useState<'DA_THU' | 'CHUA_THU'>('DA_THU');
  const [formNote, setFormNote] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Fetch revenue summary from Backend API
  const loadRevenueData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await revenueApi.getRevenueSummary(period);
      setSummaryData(data);
    } catch (error: any) {
      console.warn('Lỗi tải dữ liệu doanh thu:', error.message);
      Alert.alert('Thông báo', error.message || 'Không thể tải dữ liệu từ máy chủ.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => {
    loadRevenueData();
  }, [loadRevenueData]);

  // Đặt lại form khi mở modal tạo mới
  const handleOpenCreateModal = () => {
    const today = new Date();
    const formattedToday = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
    setFormCustomerName('');
    setFormAmount('');
    setFormDate(formattedToday);
    setFormPaymentMethod('TIEN_MAT');
    setFormPaymentStatus('DA_THU');
    setFormNote('');
    setShowCreateModal(true);
  };

  // Submit form tạo mới
  const handleCreateSubmit = async () => {
    if (!formCustomerName.trim()) {
      Alert.alert('Lỗi nhập liệu', 'Vui lòng điền tên người mua');
      return;
    }

    const rawAmount = parseFloat(formAmount.replace(/[^0-9]/g, ''));
    if (isNaN(rawAmount) || rawAmount <= 0) {
      Alert.alert('Lỗi nhập liệu', 'Vui lòng nhập số tiền hợp lệ (> 0)');
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateRevenuePayload = {
        customerName: formCustomerName.trim(),
        amount: rawAmount,
        paymentMethod: formPaymentMethod,
        paymentStatus: formPaymentStatus,
        note: formNote.trim() || undefined,
      };

      await revenueApi.createRevenue(payload);
      setShowCreateModal(false);
      Alert.alert('Thành công', 'Đã ghi nhận giao dịch doanh thu mới!');
      loadRevenueData(true);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể lưu giao dịch mới.');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle trạng thái Đã thu <-> Chưa thu
  const handleToggleStatus = async (item: RevenueItem) => {
    try {
      setShowActionModal(false);
      await revenueApi.togglePaymentStatus(item.id);
      loadRevenueData(true);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể cập nhật trạng thái');
    }
  };

  // Xóa khoản doanh thu
  const handleDeleteItem = async (item: RevenueItem) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc muốn xóa giao dịch của "${item.customerName}" với số tiền ${item.amountFormatted} ₫?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              setShowActionModal(false);
              await revenueApi.deleteRevenue(item.id);
              loadRevenueData(true);
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Không thể xóa giao dịch');
            }
          },
        },
      ]
    );
  };

  // Nhãn hiển thị kỳ
  const getPeriodDisplayLabel = () => {
    switch (period) {
      case 'month':
        return 'Tháng 10/2026';
      case 'quarter':
        return 'Quý 4/2026';
      case 'year':
        return 'Năm 2026';
      case 'all':
        return 'Tất cả kỳ';
      default:
        return 'Tháng/Quý/ Năm';
    }
  };

  // Dữ liệu items và padding dòng trống cho đủ 7 dòng như mockup
  const items = summaryData?.items || [];
  const minRows = 7;
  const emptyRowsCount = Math.max(0, minRows - items.length);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Top Header Bar điều hướng */}
      <View style={styles.navHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
          <Text style={styles.backText}>Trang chủ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => loadRevenueData(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="reload-outline" size={20} color="#059669" />
          <Text style={styles.refreshText}>Làm mới</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadRevenueData(true)}
            colors={['#059669']}
            tintColor="#059669"
          />
        }
      >
        {/* KHUNG THIẾT KẾ DOANH THU THEO HÌNH MẪU */}
        <View style={styles.mainCard}>
          {/* 1. Header Tiêu đề "Doanh thu" (Nền xanh lơ nhạt) */}
          <View style={styles.titleBanner}>
            <Text style={styles.titleBannerText}>Doanh thu</Text>
          </View>

          {/* 2. Hàng Chọn Tháng/Quý/ Năm & Tổng số tiền lớn */}
          <View style={styles.periodAndTotalRow}>
            {/* Nút dropdown Tháng/Quý/ Năm */}
            <TouchableOpacity
              style={styles.periodDropdownBtn}
              onPress={() => setShowPeriodModal(true)}
              activeOpacity={0.75}
            >
              <Text style={styles.periodDropdownText}>
                {period === 'month' ? 'Tháng/Quý/ Năm' : getPeriodDisplayLabel()}
              </Text>
              <Ionicons name="caret-down" size={13} color="#334155" style={{ marginLeft: 4 }} />
            </TouchableOpacity>

            {/* Số tiền tổng lớn (ví dụ: 30.000.000) - kích thước vừa vặn mobile */}
            <View style={styles.totalBigContainer}>
              <Text style={styles.totalBigNumber} numberOfLines={1}>
                {summaryData?.totalRevenueFormatted || '30.000.000'}
              </Text>
            </View>
          </View>

          {/* 3. Khung Bảng Tổng Hợp Doanh Thu (Grid khớp với ảnh mẫu) */}
          <View style={styles.summaryTable}>
            {/* Cột trái: "Tổng thu bằng" & Cột phải: Tiền mặt, Chuyển khoản */}
            <View style={styles.summaryRowTop}>
              <View style={styles.summaryColLeft}>
                <Text style={styles.summaryColLeftText}>Tổng thu bằng</Text>
              </View>

              <View style={styles.summaryColRight}>
                {/* Hàng Tiền mặt */}
                <View style={styles.summarySubRow}>
                  <Text style={styles.summarySubLabel}>Tiền mặt:</Text>
                  <Text style={styles.summarySubValue}>
                    {summaryData?.totalCashFormatted || '1.000.000'}
                  </Text>
                </View>

                {/* Đường kẻ ngang phân cách */}
                <View style={styles.summarySubDivider} />

                {/* Hàng Chuyển khoản */}
                <View style={styles.summarySubRow}>
                  <Text style={styles.summarySubLabel}>Chuyển khoản:</Text>
                  <Text style={styles.summarySubValue}>
                    {summaryData?.totalTransferFormatted || '-'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Hàng dưới: "Tổng số tiền chưa thu:" */}
            <View style={styles.summaryRowBottom}>
              <Text style={styles.unpaidLabel}>Tổng số tiền chưa thu:</Text>
              <Text style={styles.unpaidValue}>
                {summaryData?.totalUnpaidFormatted || '2.000.000'}
              </Text>
            </View>
          </View>

          {/* 4. Nút "+ Tạo mới" */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.createBtn}
              onPress={handleOpenCreateModal}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={18} color="#047857" style={{ marginRight: 4 }} />
              <Text style={styles.createBtnText}>Tạo mới</Text>
            </TouchableOpacity>
          </View>

          {/* 5. Bảng Danh Sách Giao Dịch Bán Hàng */}
          <View style={styles.tableContainer}>
            {/* Header cột của bảng */}
            <View style={styles.tableHeaderRow}>
              <View style={[styles.cell, styles.colStt]}>
                <Text style={styles.headerText}>STT</Text>
              </View>
              <View style={[styles.cell, styles.colDate]}>
                <Text style={styles.headerText}>Ngày GD</Text>
              </View>
              <View style={[styles.cell, styles.colCustomer]}>
                <Text style={styles.headerText}>Tên người mua</Text>
              </View>
              <View style={[styles.cell, styles.colAmount]}>
                <Text style={styles.headerText}>Số tiền</Text>
              </View>
            </View>

            {/* Danh sách các dòng dữ liệu */}
            {loading && !refreshing ? (
              <View style={styles.tableLoading}>
                <ActivityIndicator size="small" color="#059669" />
                <Text style={styles.tableLoadingText}>Đang tải dữ liệu từ máy chủ...</Text>
              </View>
            ) : (
              <>
                {items.map((item, index) => {
                  const rowNumber = (index + 1).toString().padStart(2, '0');
                  const isPaid = item.isPaid ?? (item.paymentStatus === 'DA_THU');
                  // Toàn bộ dòng màu xanh nếu đã thu tiền, toàn bộ dòng màu đen nếu chưa thu tiền
                  const rowTextColor = isPaid ? '#16A34A' : '#0F172A';

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.tableDataRow,
                        index % 2 === 1 && styles.tableDataRowEven,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => {
                        setSelectedItem(item);
                        setShowActionModal(true);
                      }}
                    >
                      {/* Cột STT: hiển thị 01, 02,... có tam giác cùng màu ở góc */}
                      <View style={[styles.cell, styles.colStt, styles.sttCellContainer]}>
                        <View
                          style={[
                            styles.triangleCorner,
                            { borderTopColor: isPaid ? '#10B981' : '#0F172A' },
                          ]}
                        />
                        <Text style={[styles.cellTextBase, { color: rowTextColor }]}>
                          {rowNumber}
                        </Text>
                      </View>

                      {/* Cột Ngày / tháng / năm: cùng màu toàn dòng */}
                      <View style={[styles.cell, styles.colDate]}>
                        <Text style={[styles.cellTextBase, { color: rowTextColor }]}>
                          {item.transactionDateFormatted || item.transactionDate}
                        </Text>
                      </View>

                      {/* Cột Tên người mua: cùng màu toàn dòng */}
                      <View style={[styles.cell, styles.colCustomer]}>
                        <Text
                          style={[styles.cellCustomerText, { color: rowTextColor }]}
                          numberOfLines={2}
                          ellipsizeMode="tail"
                        >
                          {item.customerName}
                        </Text>
                      </View>

                      {/* Cột Số tiền: cùng màu toàn dòng */}
                      <View style={[styles.cell, styles.colAmount, styles.amountCellCol]}>
                        <Text
                          style={[styles.amountText, { color: rowTextColor }]}
                          numberOfLines={1}
                        >
                          {item.amountFormatted}
                        </Text>
                        <Text
                          style={[styles.statusTagText, { color: rowTextColor }]}
                        >
                          {isPaid ? 'đã thu tiền' : 'chưa thu tiền'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}

                {/* Các dòng trống mô phỏng sổ kẻ ô giống hệt ảnh mockup (03, 04, 05, 06, 07) */}
                {Array.from({ length: emptyRowsCount }).map((_, i) => {
                  const emptyRowIndex = (items.length + i + 1).toString().padStart(2, '0');
                  return (
                    <View
                      key={`empty-${i}`}
                      style={[
                        styles.tableDataRow,
                        styles.emptyRow,
                        (items.length + i) % 2 === 1 && styles.tableDataRowEven,
                      ]}
                    >
                      <View style={[styles.cell, styles.colStt, styles.sttCellContainer]}>
                        <View style={styles.triangleCorner} />
                        <Text style={styles.cellTextDark}>{emptyRowIndex}</Text>
                      </View>
                      <View style={[styles.cell, styles.colDate]} />
                      <View style={[styles.cell, styles.colCustomer]} />
                      <View style={[styles.cell, styles.colAmount]} />
                    </View>
                  );
                })}
              </>
            )}
          </View>

          {/* Ghi chú hướng dẫn nhanh ở đáy bảng */}
          <View style={styles.instructionBox}>
            <View style={styles.instructionItem}>
              <View style={[styles.legendDot, { backgroundColor: '#16A34A' }]} />
              <Text style={styles.instructionText}>
                Toàn bộ dòng màu xanh lá: <Text style={{ fontWeight: '700', color: '#16A34A' }}>Đã thu tiền</Text>
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <View style={[styles.legendDot, { backgroundColor: '#0F172A' }]} />
              <Text style={styles.instructionText}>
                Toàn bộ dòng màu đen: <Text style={{ fontWeight: '700', color: '#0F172A' }}>Chưa thu tiền</Text>
              </Text>
            </View>
            <Text style={styles.instructionSubtext}>
              * Nhấn vào từng dòng để đổi trạng thái thu tiền hoặc xóa giao dịch
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ========================================================= */}
      {/* MODAL 1: BỘ LỌC THÁNG / QUÝ / NĂM / TẤT CẢ */}
      {/* ========================================================= */}
      <Modal
        visible={showPeriodModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPeriodModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPeriodModal(false)}
        >
          <View style={styles.periodPickerModalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Chọn kỳ xem doanh thu</Text>
              <TouchableOpacity onPress={() => setShowPeriodModal(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.periodOptionItem,
                period === 'month' && styles.periodOptionSelected,
              ]}
              onPress={() => {
                setPeriod('month');
                setShowPeriodModal(false);
              }}
            >
              <Ionicons
                name="calendar-outline"
                size={20}
                color={period === 'month' ? '#059669' : '#64748B'}
              />
              <Text
                style={[
                  styles.periodOptionText,
                  period === 'month' && styles.periodOptionTextSelected,
                ]}
              >
                Tháng này (Tháng 10/2026)
              </Text>
              {period === 'month' && (
                <Ionicons name="checkmark-circle" size={20} color="#059669" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.periodOptionItem,
                period === 'quarter' && styles.periodOptionSelected,
              ]}
              onPress={() => {
                setPeriod('quarter');
                setShowPeriodModal(false);
              }}
            >
              <Ionicons
                name="pie-chart-outline"
                size={20}
                color={period === 'quarter' ? '#059669' : '#64748B'}
              />
              <Text
                style={[
                  styles.periodOptionText,
                  period === 'quarter' && styles.periodOptionTextSelected,
                ]}
              >
                Quý này (Quý 4/2026)
              </Text>
              {period === 'quarter' && (
                <Ionicons name="checkmark-circle" size={20} color="#059669" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.periodOptionItem,
                period === 'year' && styles.periodOptionSelected,
              ]}
              onPress={() => {
                setPeriod('year');
                setShowPeriodModal(false);
              }}
            >
              <Ionicons
                name="time-outline"
                size={20}
                color={period === 'year' ? '#059669' : '#64748B'}
              />
              <Text
                style={[
                  styles.periodOptionText,
                  period === 'year' && styles.periodOptionTextSelected,
                ]}
              >
                Năm nay (Năm 2026)
              </Text>
              {period === 'year' && (
                <Ionicons name="checkmark-circle" size={20} color="#059669" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.periodOptionItem,
                period === 'all' && styles.periodOptionSelected,
              ]}
              onPress={() => {
                setPeriod('all');
                setShowPeriodModal(false);
              }}
            >
              <Ionicons
                name="layers-outline"
                size={20}
                color={period === 'all' ? '#059669' : '#64748B'}
              />
              <Text
                style={[
                  styles.periodOptionText,
                  period === 'all' && styles.periodOptionTextSelected,
                ]}
              >
                Tất cả thời gian
              </Text>
              {period === 'all' && (
                <Ionicons name="checkmark-circle" size={20} color="#059669" />
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 2: TẠO GIAO DỊCH / KHOẢN THU MỚI (+ Tạo mới) */}
      {/* ========================================================= */}
      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.createModalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.createIconBadge}>
                  <Ionicons name="add" size={20} color="#047857" />
                </View>
                <Text style={styles.modalTitle}>Thêm doanh thu mới</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
              {/* Tên người mua */}
              <Text style={styles.formLabel}>Tên người mua *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Ví dụ: Nguyễn Văn A"
                placeholderTextColor="#94A3B8"
                value={formCustomerName}
                onChangeText={setFormCustomerName}
              />

              {/* Số tiền */}
              <Text style={styles.formLabel}>Số tiền (VNĐ) *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Ví dụ: 1000000"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={formAmount}
                onChangeText={(text) => {
                  const num = text.replace(/[^0-9]/g, '');
                  if (num) {
                    setFormAmount(Number(num).toLocaleString('vi-VN'));
                  } else {
                    setFormAmount('');
                  }
                }}
              />

              {/* Hình thức thanh toán */}
              <Text style={styles.formLabel}>Hình thức thu tiền</Text>
              <View style={styles.paymentMethodRow}>
                <TouchableOpacity
                  style={[
                    styles.methodBtn,
                    formPaymentMethod === 'TIEN_MAT' && styles.methodBtnActive,
                  ]}
                  onPress={() => setFormPaymentMethod('TIEN_MAT')}
                >
                  <Ionicons
                    name="cash-outline"
                    size={18}
                    color={formPaymentMethod === 'TIEN_MAT' ? '#047857' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.methodBtnText,
                      formPaymentMethod === 'TIEN_MAT' && styles.methodBtnTextActive,
                    ]}
                  >
                    Tiền mặt
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.methodBtn,
                    formPaymentMethod === 'CHUYEN_KHOAN' && styles.methodBtnActive,
                  ]}
                  onPress={() => setFormPaymentMethod('CHUYEN_KHOAN')}
                >
                  <Ionicons
                    name="card-outline"
                    size={18}
                    color={formPaymentMethod === 'CHUYEN_KHOAN' ? '#047857' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.methodBtnText,
                      formPaymentMethod === 'CHUYEN_KHOAN' && styles.methodBtnTextActive,
                    ]}
                  >
                    Chuyển khoản
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Trạng thái thu tiền */}
              <Text style={styles.formLabel}>Trạng thái thu tiền</Text>
              <View style={styles.paymentMethodRow}>
                <TouchableOpacity
                  style={[
                    styles.statusBtn,
                    formPaymentStatus === 'DA_THU' && styles.statusBtnPaidActive,
                  ]}
                  onPress={() => setFormPaymentStatus('DA_THU')}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={formPaymentStatus === 'DA_THU' ? '#16A34A' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.statusBtnText,
                      formPaymentStatus === 'DA_THU' && styles.statusBtnPaidTextActive,
                    ]}
                  >
                    Đã thu tiền (Xanh lá)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.statusBtn,
                    formPaymentStatus === 'CHUA_THU' && styles.statusBtnUnpaidActive,
                  ]}
                  onPress={() => setFormPaymentStatus('CHUA_THU')}
                >
                  <Ionicons
                    name="time-outline"
                    size={18}
                    color={formPaymentStatus === 'CHUA_THU' ? '#0F172A' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.statusBtnText,
                      formPaymentStatus === 'CHUA_THU' && styles.statusBtnUnpaidTextActive,
                    ]}
                  >
                    Chưa thu tiền (Đen)
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Ghi chú */}
              <Text style={styles.formLabel}>Ghi chú (Tùy chọn)</Text>
              <TextInput
                style={[styles.formInput, { height: 72, textAlignVertical: 'top' }]}
                placeholder="Ghi chú thêm về đơn hàng hoặc mặt hàng..."
                placeholderTextColor="#94A3B8"
                multiline={true}
                value={formNote}
                onChangeText={setFormNote}
              />
            </ScrollView>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowCreateModal(false)}
                disabled={submitting}
              >
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
                onPress={handleCreateSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.submitBtnText}>Lưu doanh thu</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 3: THAO TÁC NHANH TRÊN DÒNG DỮ LIỆU */}
      {/* ========================================================= */}
      <Modal
        visible={showActionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowActionModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowActionModal(false)}
        >
          <View style={styles.actionModalCard}>
            <Text style={styles.actionModalTitle}>Thao tác khoản doanh thu</Text>
            {selectedItem && (
              <View style={styles.actionItemInfo}>
                <Text style={styles.actionItemName}>{selectedItem.customerName}</Text>
                <Text
                  style={[
                    styles.actionItemAmount,
                    selectedItem.isPaid ? { color: '#16A34A' } : { color: '#0F172A' },
                  ]}
                >
                  {selectedItem.amountFormatted} ₫ ({selectedItem.isPaid ? 'Đã thu tiền' : 'Chưa thu tiền'})
                </Text>
                <Text style={styles.actionItemDate}>
                  Ngày: {selectedItem.transactionDateFormatted || selectedItem.transactionDate} • {selectedItem.paymentMethodLabel}
                </Text>
              </View>
            )}

            {/* Nút Đổi trạng thái */}
            <TouchableOpacity
              style={styles.actionOptionBtn}
              onPress={() => selectedItem && handleToggleStatus(selectedItem)}
            >
              <Ionicons
                name="swap-horizontal-outline"
                size={20}
                color="#0284C7"
              />
              <Text style={styles.actionOptionText}>
                Đổi thành: {selectedItem?.isPaid ? 'Chưa thu tiền (Đen)' : 'Đã thu tiền (Xanh lá)'}
              </Text>
            </TouchableOpacity>

            {/* Nút Xóa */}
            <TouchableOpacity
              style={[styles.actionOptionBtn, { borderColor: '#FEE2E2' }]}
              onPress={() => selectedItem && handleDeleteItem(selectedItem)}
            >
              <Ionicons name="trash-outline" size={20} color="#DC2626" />
              <Text style={[styles.actionOptionText, { color: '#DC2626' }]}>
                Xóa khoản doanh thu này
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCloseBtn}
              onPress={() => setShowActionModal(false)}
            >
              <Text style={styles.actionCloseText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EDF7F2', // Background màu xanh nhẹ theo đúng yêu cầu
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#EDF7F2',
    borderBottomWidth: 1,
    borderBottomColor: '#D1E7DD',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#E2F3EB',
  },
  backText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  refreshText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
  },
  scrollContainer: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 28,
  },

  // Khung chính mô phỏng màn hình trong ảnh người dùng gửi
  mainCard: {
    backgroundColor: '#F3FAF6', // Nền xanh nhạt pastel
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#BFE7D3',
    padding: 8,
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  // 1. Tiêu đề "Doanh thu"
  titleBanner: {
    backgroundColor: '#D2F4F8', // Nền xanh lơ nhạt như trong thiết kế
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  titleBannerText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0369A1',
    letterSpacing: 0.3,
  },

  // 2. Hàng Tháng/Quý/ Năm & 30.000.000 - kích thước hài hòa khung mobile
  periodAndTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 2,
    marginBottom: 6,
  },
  periodDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
    backgroundColor: 'transparent',
  },
  periodDropdownText: {
    fontSize: 12.5,
    fontStyle: 'italic',
    color: '#334155',
    fontWeight: '600',
  },
  totalBigContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  totalBigNumber: {
    fontSize: 17, // Thu nhỏ số 30 triệu cho vừa vặn khung điện thoại
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.2,
  },

  // 3. Khung bảng tổng hợp doanh thu (Grid border xanh lá nhạt)
  summaryTable: {
    borderWidth: 1.5,
    borderColor: '#4ADE80',
    borderRadius: 6,
    backgroundColor: '#E8FDF0',
    overflow: 'hidden',
    marginBottom: 12,
  },
  summaryRowTop: {
    flexDirection: 'row',
    borderBottomWidth: 1.5,
    borderBottomColor: '#4ADE80',
  },
  summaryColLeft: {
    width: '38%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRightWidth: 1.5,
    borderRightColor: '#4ADE80',
    backgroundColor: '#DEF9E7',
  },
  summaryColLeftText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991B1B', // Màu đỏ sẫm như trong ảnh "Tổng thu bằng"
    textAlign: 'center',
  },
  summaryColRight: {
    flex: 1,
    justifyContent: 'center',
  },
  summarySubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  summarySubDivider: {
    height: 1,
    backgroundColor: '#86EFAC',
  },
  summarySubLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7F1D1D',
  },
  summarySubValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991B1B',
  },
  summaryRowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: '#DEF9E7',
  },
  unpaidLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7F1D1D',
  },
  unpaidValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },

  // 4. Hàng nút "+ Tạo mới"
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  createBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#047857',
  },

  // 5. Bảng dữ liệu
  tableContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    overflow: 'hidden',
    width: '100%',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1.5,
    borderBottomColor: '#CBD5E1',
    paddingVertical: 6,
    alignItems: 'center',
  },
  cell: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  colStt: {
    width: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  colDate: {
    width: 68,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  colCustomer: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: 6,
    paddingRight: 4,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  colAmount: {
    width: 86,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 5,
  },
  headerText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0F172A',
  },

  tableDataRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    minHeight: 40,
    alignItems: 'center',
  },
  tableDataRowEven: {
    backgroundColor: '#F9FCFA',
  },
  emptyRow: {
    height: 36,
  },
  sttCellContainer: {
    position: 'relative',
  },
  triangleCorner: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 0,
    height: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderRightColor: 'transparent',
  },
  cellTextBase: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  cellTextDark: {
    fontSize: 10.5,
    fontWeight: '500',
    color: '#475569',
  },
  cellCustomerText: {
    fontSize: 10.5,
    fontWeight: '600',
    lineHeight: 14,
  },

  // Cột Số tiền
  amountCellCol: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  amountText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  statusTagText: {
    fontSize: 8.5,
    fontWeight: '700',
    marginTop: 1,
  },

  tableLoading: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableLoadingText: {
    marginTop: 8,
    fontSize: 13,
    color: '#64748B',
  },

  // Legend / hướng dẫn ở chân trang
  instructionBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#E8FDF0',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  instructionText: {
    fontSize: 12,
    color: '#334155',
  },
  instructionSubtext: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#64748B',
    marginTop: 4,
  },

  // Modals chung
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },

  // Modal Chọn kỳ
  periodPickerModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  periodOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  periodOptionSelected: {
    borderColor: '#059669',
    backgroundColor: '#ECFDF5',
  },
  periodOptionText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
  },
  periodOptionTextSelected: {
    fontWeight: '700',
    color: '#059669',
  },

  // Modal Tạo mới (+ Tạo mới)
  createModalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  createIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10,
  },
  formInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  paymentMethodRow: {
    flexDirection: 'row',
    gap: 10,
  },
  methodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
  },
  methodBtnActive: {
    borderColor: '#059669',
    backgroundColor: '#ECFDF5',
  },
  methodBtnText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  methodBtnTextActive: {
    fontWeight: '700',
    color: '#059669',
  },
  statusBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
  },
  statusBtnPaidActive: {
    borderColor: '#16A34A',
    backgroundColor: '#ECFDF5',
  },
  statusBtnPaidTextActive: {
    fontWeight: '700',
    color: '#16A34A',
  },
  statusBtnUnpaidActive: {
    borderColor: '#0F172A',
    backgroundColor: '#F1F5F9',
  },
  statusBtnUnpaidTextActive: {
    fontWeight: '700',
    color: '#0F172A',
  },
  statusBtnText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#059669',
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Modal 3: Action modal
  actionModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  actionModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  actionItemInfo: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  actionItemAmount: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
  },
  actionItemDate: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  actionOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    backgroundColor: '#F0F9FF',
    marginBottom: 10,
  },
  actionOptionText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#0284C7',
  },
  actionCloseBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  actionCloseText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
});
