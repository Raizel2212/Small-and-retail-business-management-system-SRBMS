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
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { revenueApi, productCatalogService, DEFAULT_PRODUCTS } from '../api/revenueApi';
import { RevenueSummary, RevenueItem, CreateRevenuePayload, ProductCatalogItem } from '../types/revenue';

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
  const [showCatalogModal, setShowCatalogModal] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<RevenueItem | null>(null);
  const [showActionModal, setShowActionModal] = useState<boolean>(false);

  // Danh mục mặt hàng khởi tạo
  const [catalog, setCatalog] = useState<ProductCatalogItem[]>(DEFAULT_PRODUCTS);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [catalogSearch, setCatalogSearch] = useState<string>('');

  // Form state cho việc tạo mới đơn trong doanh thu
  const [formIsRetailCustomer, setFormIsRetailCustomer] = useState<boolean>(false);
  const [formCustomerName, setFormCustomerName] = useState<string>('');
  const [formProductName, setFormProductName] = useState<string>('');
  const [formQuantity, setFormQuantity] = useState<number>(1);
  const [formUnitPrice, setFormUnitPrice] = useState<string>('');
  const [formDate, setFormDate] = useState<string>('');
  const [formPaymentMethod, setFormPaymentMethod] = useState<'TIEN_MAT' | 'CHUYEN_KHOAN'>('TIEN_MAT');
  const [formPaymentStatus, setFormPaymentStatus] = useState<'DA_THU' | 'CHUA_THU'>('DA_THU');
  const [formNote, setFormNote] = useState<string>('');
  const [saveToCatalog, setSaveToCatalog] = useState<boolean>(false);
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
    // Load catalog ban đầu
    productCatalogService.getCatalog().then((cat) => setCatalog(cat)).catch(() => {});
  }, [loadRevenueData]);

  // STT tự động nhảy đến số tiếp theo
  const nextSttNumber = (summaryData?.items?.length || 0) + 1;
  const nextSttFormatted = nextSttNumber.toString().padStart(2, '0');

  // Đơn giá và thành tiền tự động tính real-time
  const parsedUnitPrice = parseFloat(formUnitPrice.replace(/[^0-9]/g, '')) || 0;
  const currentQuantity = formQuantity > 0 ? formQuantity : 1;
  const computedTotalAmount = currentQuantity * parsedUnitPrice;
  const computedTotalFormatted = computedTotalAmount.toLocaleString('vi-VN');

  // Đặt lại form khi mở modal tạo mới đơn
  const handleOpenCreateModal = async () => {
    const today = new Date();
    const formattedToday = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
    
    try {
      const freshCatalog = await productCatalogService.getCatalog();
      setCatalog(freshCatalog);
    } catch {}

    setFormIsRetailCustomer(false);
    setFormCustomerName('');
    setFormProductName('');
    setSelectedProductId('');
    setFormQuantity(1);
    setFormUnitPrice('');
    setFormDate(formattedToday);
    setFormPaymentMethod('TIEN_MAT');
    setFormPaymentStatus('DA_THU');
    setFormNote('');
    setSaveToCatalog(false);
    setShowCreateModal(true);
  };

  // Toggle checkbox "Khách lẻ"
  const handleToggleRetailCustomer = (checked: boolean) => {
    setFormIsRetailCustomer(checked);
    if (checked) {
      setFormCustomerName('Khách lẻ');
    } else {
      if (formCustomerName === 'Khách lẻ') {
        setFormCustomerName('');
      }
    }
  };

  // Khi người dùng gõ tay tên khách hàng
  const handleCustomerNameChange = (text: string) => {
    setFormCustomerName(text);
    if (text.trim().toLowerCase() === 'khách lẻ') {
      setFormIsRetailCustomer(true);
    } else if (formIsRetailCustomer) {
      setFormIsRetailCustomer(false);
    }
  };

  // Chọn mặt hàng khởi tạo trong danh mục mẫu (ĐƠN GIÁ TỰ ĐỘNG NHẢY THEO ID/TÊN MẶT HÀNG)
  const handleSelectProduct = (prod: ProductCatalogItem) => {
    setSelectedProductId(prod.id);
    setFormProductName(prod.name);
    setFormUnitPrice(prod.price.toLocaleString('vi-VN'));
    setShowCatalogModal(false);
  };

  // Người dùng nhập tay tên hàng: nếu khớp với mặt hàng đã lưu thì đơn giá tự động nhảy
  const handleProductNameChange = (text: string) => {
    setFormProductName(text);
    const trimmed = text.trim().toLowerCase();
    const match = catalog.find(
      (p) => p.name.trim().toLowerCase() === trimmed || p.id.trim().toLowerCase() === trimmed
    );
    if (match) {
      setSelectedProductId(match.id);
      setFormUnitPrice(match.price.toLocaleString('vi-VN'));
    } else {
      setSelectedProductId('');
    }
  };

  // Tăng số lượng (mũi tên lên ▲)
  const handleQuantityIncrease = () => {
    setFormQuantity((prev) => (prev > 0 ? prev + 1 : 1));
  };

  // Giảm số lượng (mũi tên xuống ▼)
  const handleQuantityDecrease = () => {
    setFormQuantity((prev) => Math.max(1, prev - 1));
  };

  // Nhập số lượng từ bàn phím
  const handleQuantityChange = (text: string) => {
    const clean = text.replace(/[^0-9]/g, '');
    if (!clean) {
      setFormQuantity(1);
    } else {
      const val = parseInt(clean, 10);
      setFormQuantity(val > 0 ? val : 1);
    }
  };

  // Nhập đơn giá
  const handleUnitPriceChange = (text: string) => {
    const clean = text.replace(/[^0-9]/g, '');
    if (clean) {
      setFormUnitPrice(Number(clean).toLocaleString('vi-VN'));
    } else {
      setFormUnitPrice('');
    }
  };

  // Submit form tạo mới đơn hàng trong doanh thu
  const handleCreateSubmit = async () => {
    if (!formCustomerName.trim()) {
      Alert.alert('Lỗi nhập liệu', 'Vui lòng điền tên khách hàng hoặc tick chọn "Khách lẻ"');
      return;
    }

    if (!formProductName.trim()) {
      Alert.alert('Lỗi nhập liệu', 'Vui lòng nhập tên mặt hàng');
      return;
    }

    if (formQuantity <= 0) {
      Alert.alert('Lỗi nhập liệu', 'Số lượng phải lớn hơn 0');
      return;
    }

    if (parsedUnitPrice <= 0) {
      Alert.alert('Lỗi nhập liệu', 'Vui lòng nhập đơn giá hợp lệ (> 0)');
      return;
    }

    setSubmitting(true);
    try {
      // Nếu user muốn lưu mặt hàng này vào danh mục khởi tạo
      if (saveToCatalog || !selectedProductId) {
        const nextId = `SP${(catalog.length + 1).toString().padStart(2, '0')}`;
        await productCatalogService.addOrUpdateProduct({
          id: selectedProductId || nextId,
          name: formProductName.trim(),
          price: parsedUnitPrice,
        });
      }

      const payload: CreateRevenuePayload = {
        customerName: formCustomerName.trim(),
        productName: formProductName.trim(),
        quantity: formQuantity,
        unitPrice: parsedUnitPrice,
        amount: computedTotalAmount,
        isRetailCustomer: formIsRetailCustomer,
        paymentMethod: formPaymentMethod,
        paymentStatus: formPaymentStatus,
        note: formNote.trim() || undefined,
      };

      await revenueApi.createRevenue(payload);
      setShowCreateModal(false);
      Alert.alert(
        'Thành công',
        `Đã tạo mới đơn bán hàng STT ${nextSttFormatted} cho "${formCustomerName.trim()}"!\nTổng tiền thanh toán: ${computedTotalFormatted} ₫`
      );
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

      {/* Watermark Background Trống đồng Đông Sơn & Bản đồ Việt Nam */}
      <View style={styles.backgroundWatermarkBox} pointerEvents="none">
        <Image
          source={require('../../assets/trong_dong_map_bg.png')}
          style={styles.backgroundWatermark}
          resizeMode="cover"
        />
      </View>

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
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {item.customerName}
                        </Text>
                        {item.productName ? (
                          <Text
                            style={[styles.cellProductSubText, { color: rowTextColor }]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {item.productName}{item.quantity ? ` (${item.quantity})` : ''}
                          </Text>
                        ) : null}
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
      {/* MODAL 2: TẠO MỚI ĐƠN HÀNG DOANH THU CHI TIẾT */}
      {/* ========================================================= */}
      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.createModalCard}>
            {/* Header Modal */}
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={styles.createIconBadge}>
                  <Ionicons name="cart" size={18} color="#047857" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Tạo mới đơn bán hàng</Text>
                  <Text style={styles.modalSubTitle}>Ghi nhận chi tiết đơn doanh thu</Text>
                </View>
              </View>

              {/* Huy hiệu STT tự nhảy đến số tiếp theo */}
              <View style={styles.sttBadgeContainer}>
                <Text style={styles.sttBadgeLabel}>STT ĐƠN</Text>
                <Text style={styles.sttBadgeNumber}>{nextSttFormatted}</Text>
              </View>

              <TouchableOpacity
                onPress={() => setShowCreateModal(false)}
                style={{ marginLeft: 8, padding: 4 }}
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }}>
              {/* 1. TÊN KHÁCH HÀNG & Ô TICK "KHÁCH LẺ" */}
              <View style={styles.fieldHeaderRow}>
                <Text style={styles.formLabel}>Tên khách hàng *</Text>
                <TouchableOpacity
                  style={[
                    styles.retailCheckboxContainer,
                    formIsRetailCustomer && styles.retailCheckboxContainerActive,
                  ]}
                  onPress={() => handleToggleRetailCustomer(!formIsRetailCustomer)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.checkboxBox,
                      formIsRetailCustomer && styles.checkboxBoxActive,
                    ]}
                  >
                    {formIsRetailCustomer && (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.retailCheckboxLabel,
                      formIsRetailCustomer && styles.retailCheckboxLabelActive,
                    ]}
                  >
                    Khách lẻ
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputWithIconContainer}>
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={formIsRetailCustomer ? '#059669' : '#64748B'}
                  style={styles.inputLeftIcon}
                />
                <TextInput
                  style={[
                    styles.formInputWithIcon,
                    formIsRetailCustomer && styles.formInputRetailActive,
                  ]}
                  placeholder="Nhập họ tên khách hàng (hoặc tick Khách lẻ)"
                  placeholderTextColor="#94A3B8"
                  value={formCustomerName}
                  onChangeText={handleCustomerNameChange}
                  editable={!formIsRetailCustomer}
                />
                {formIsRetailCustomer && (
                  <View style={styles.retailTagBadge}>
                    <Text style={styles.retailTagBadgeText}>Đã tick Khách lẻ</Text>
                  </View>
                )}
              </View>

              {/* 2. TÊN HÀNG & DANH MỤC MẶT HÀNG KHỞI TẠO (ĐƠN GIÁ TỰ NHẢY) */}
              <View style={styles.fieldHeaderRow}>
                <Text style={styles.formLabel}>Tên hàng (User nhập tay) *</Text>
                <TouchableOpacity
                  style={styles.catalogLinkBtn}
                  onPress={() => setShowCatalogModal(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="grid-outline" size={14} color="#0284C7" />
                  <Text style={styles.catalogLinkText}>Kho mặt hàng ({catalog.length})</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.formInput}
                placeholder="Nhập tên mặt hàng (VD: Cà phê, Nước ngọt, Gạo...)"
                placeholderTextColor="#94A3B8"
                value={formProductName}
                onChangeText={handleProductNameChange}
              />

              {/* Thanh gợi ý nhanh các mặt hàng đã khởi tạo */}
              <View style={styles.presetCatalogSection}>
                <Text style={styles.presetSectionLabel}>
                  Chọn mẫu mặt hàng đã khởi tạo (Đơn giá tự động nhảy):
                </Text>
                <ScrollView
                  horizontal={true}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.presetChipsScroll}
                >
                  {catalog.slice(0, 8).map((prod) => {
                    const isSelected =
                      selectedProductId === prod.id ||
                      formProductName.trim().toLowerCase() === prod.name.trim().toLowerCase();
                    return (
                      <TouchableOpacity
                        key={prod.id}
                        style={[
                          styles.presetChip,
                          isSelected && styles.presetChipActive,
                        ]}
                        onPress={() => handleSelectProduct(prod)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.presetChipText,
                            isSelected && styles.presetChipTextActive,
                          ]}
                        >
                          <Text style={{ fontWeight: '700' }}>[{prod.id}]</Text> {prod.name}
                        </Text>
                        <Text
                          style={[
                            styles.presetChipPrice,
                            isSelected && styles.presetChipPriceActive,
                          ]}
                        >
                          {prod.price.toLocaleString('vi-VN')} ₫
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* 3. SỐ LƯỢNG & ĐƠN GIÁ (2 CỘT SONG SONG) */}
              <View style={styles.formRowTwoCols}>
                {/* Cột Số lượng (Stepper mũi tên lên xuống) */}
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>Số lượng</Text>
                  <View style={styles.stepperContainer}>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={handleQuantityDecrease}
                      activeOpacity={0.6}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="chevron-down" size={18} color="#0F172A" />
                    </TouchableOpacity>

                    <TextInput
                      style={styles.stepperInput}
                      keyboardType="numeric"
                      value={formQuantity.toString()}
                      onChangeText={handleQuantityChange}
                      textAlign="center"
                    />

                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={handleQuantityIncrease}
                      activeOpacity={0.6}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="chevron-up" size={18} color="#0F172A" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Cột Đơn giá (Tự nhảy theo ID/tên mặt hàng) */}
                <View style={styles.formCol}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={styles.formLabel}>Đơn giá (₫) *</Text>
                    {selectedProductId ? (
                      <Text style={styles.autoPriceHint}>Tự nhảy ✓</Text>
                    ) : null}
                  </View>
                  <TextInput
                    style={[
                      styles.formInput,
                      selectedProductId ? styles.formInputAutoPrice : null,
                    ]}
                    placeholder="VD: 25.000"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={formUnitPrice}
                    onChangeText={handleUnitPriceChange}
                  />
                </View>
              </View>

              {/* 4. THÀNH TIỀN (Tự động tính: Số lượng x Đơn giá) */}
              <View style={styles.lineTotalCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="calculator-outline" size={18} color="#047857" style={{ marginRight: 6 }} />
                  <Text style={styles.lineTotalLabel}>Thành tiền:</Text>
                </View>
                <Text style={styles.lineTotalFormula}>
                  {currentQuantity} × {parsedUnitPrice > 0 ? parsedUnitPrice.toLocaleString('vi-VN') : '0'} ={' '}
                  <Text style={styles.lineTotalHighlight}>{computedTotalFormatted} ₫</Text>
                </Text>
              </View>

              {/* 5. TIỀN MẶT / CHUYỂN KHOẢN (CÓ THỂ TÍCH VÀO 1 TRONG 2) */}
              <Text style={styles.formLabel}>Hình thức thanh toán (Tích chọn 1 trong 2):</Text>
              <View style={styles.paymentMethodRow}>
                <TouchableOpacity
                  style={[
                    styles.methodBtn,
                    formPaymentMethod === 'TIEN_MAT' && styles.methodBtnActive,
                  ]}
                  onPress={() => setFormPaymentMethod('TIEN_MAT')}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      formPaymentMethod === 'TIEN_MAT' && styles.radioCircleActive,
                    ]}
                  >
                    {formPaymentMethod === 'TIEN_MAT' && <View style={styles.radioInner} />}
                  </View>
                  <Ionicons
                    name="cash-outline"
                    size={18}
                    color={formPaymentMethod === 'TIEN_MAT' ? '#047857' : '#64748B'}
                    style={{ marginLeft: 6 }}
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
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      formPaymentMethod === 'CHUYEN_KHOAN' && styles.radioCircleActive,
                    ]}
                  >
                    {formPaymentMethod === 'CHUYEN_KHOAN' && <View style={styles.radioInner} />}
                  </View>
                  <Ionicons
                    name="card-outline"
                    size={18}
                    color={formPaymentMethod === 'CHUYEN_KHOAN' ? '#047857' : '#64748B'}
                    style={{ marginLeft: 6 }}
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

              {/* 6. TRẠNG THÁI THU TIỀN */}
              <Text style={styles.formLabel}>Trạng thái thu tiền:</Text>
              <View style={styles.paymentMethodRow}>
                <TouchableOpacity
                  style={[
                    styles.statusBtn,
                    formPaymentStatus === 'DA_THU' && styles.statusBtnPaidActive,
                  ]}
                  onPress={() => setFormPaymentStatus('DA_THU')}
                  activeOpacity={0.7}
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
                  activeOpacity={0.7}
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

              {/* 7. BẢNG XEM TRƯỚC ĐƠN HÀNG (MINI ORDER TABLE PREVIEW) */}
              <View style={styles.orderPreviewBox}>
                <View style={styles.previewBoxHeader}>
                  <Ionicons name="eye-outline" size={15} color="#0369A1" />
                  <Text style={styles.previewBoxTitle}>Xem trước bảng đơn hàng mới:</Text>
                </View>

                <View style={styles.miniTable}>
                  <View style={styles.miniTableHeader}>
                    <Text style={[styles.miniHeaderCell, { width: 32 }]}>STT</Text>
                    <Text style={[styles.miniHeaderCell, { flex: 1.2 }]}>Khách hàng</Text>
                    <Text style={[styles.miniHeaderCell, { flex: 1.3 }]}>Tên hàng</Text>
                    <Text style={[styles.miniHeaderCell, { width: 28 }]}>SL</Text>
                    <Text style={[styles.miniHeaderCell, { flex: 1.1 }]}>Đơn giá</Text>
                    <Text style={[styles.miniHeaderCell, { flex: 1.2 }]}>Thành tiền</Text>
                    <Text style={[styles.miniHeaderCell, { width: 44 }]}>HTTT</Text>
                  </View>

                  <View style={styles.miniTableRow}>
                    <Text style={[styles.miniDataCell, { width: 32, fontWeight: '700', color: '#059669' }]}>
                      {nextSttFormatted}
                    </Text>
                    <Text style={[styles.miniDataCell, { flex: 1.2, fontWeight: '600' }]} numberOfLines={1}>
                      {formCustomerName || '-'}
                    </Text>
                    <Text style={[styles.miniDataCell, { flex: 1.3 }]} numberOfLines={1}>
                      {formProductName || '-'}
                    </Text>
                    <Text style={[styles.miniDataCell, { width: 28, fontWeight: '700' }]}>
                      {formQuantity}
                    </Text>
                    <Text style={[styles.miniDataCell, { flex: 1.1 }]}>
                      {formUnitPrice || '0'}
                    </Text>
                    <Text style={[styles.miniDataCell, { flex: 1.2, fontWeight: '700', color: '#047857' }]}>
                      {computedTotalFormatted}
                    </Text>
                    <Text style={[styles.miniDataCell, { width: 44, fontSize: 10 }]}>
                      {formPaymentMethod === 'TIEN_MAT' ? 'Tiền mặt' : 'CK'}
                    </Text>
                  </View>
                </View>

                {/* TỔNG TIỀN THANH TOÁN LỚN NỔI BẬT */}
                <View style={styles.grandTotalBanner}>
                  <Text style={styles.grandTotalLabel}>TỔNG TIỀN THANH TOÁN:</Text>
                  <Text style={styles.grandTotalValue}>{computedTotalFormatted} ₫</Text>
                </View>
              </View>

              {/* Tùy chọn lưu mặt hàng vào danh mục */}
              {!selectedProductId && formProductName.trim().length > 0 && parsedUnitPrice > 0 && (
                <TouchableOpacity
                  style={styles.saveCatalogCheckRow}
                  onPress={() => setSaveToCatalog(!saveToCatalog)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkboxBox, saveToCatalog && styles.checkboxBoxActive]}>
                    {saveToCatalog && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
                  </View>
                  <Text style={styles.saveCatalogCheckText}>
                    Lưu mặt hàng "{formProductName.trim()}" kèm đơn giá này vào danh mục khởi tạo
                  </Text>
                </TouchableOpacity>
              )}

              {/* Ghi chú */}
              <Text style={styles.formLabel}>Ghi chú (Tùy chọn)</Text>
              <TextInput
                style={[styles.formInput, { height: 60, textAlignVertical: 'top' }]}
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
                    <Text style={styles.submitBtnText}>Lưu đơn hàng ({computedTotalFormatted} ₫)</Text>
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
                <View style={styles.actionDetailRow}>
                  <Text style={styles.actionDetailLabel}>Khách hàng:</Text>
                  <Text style={styles.actionItemName}>{selectedItem.customerName}</Text>
                </View>
                {selectedItem.productName ? (
                  <View style={styles.actionDetailRow}>
                    <Text style={styles.actionDetailLabel}>Mặt hàng:</Text>
                    <Text style={styles.actionDetailValue}>
                      {selectedItem.productName} (SL: {selectedItem.quantity || 1})
                    </Text>
                  </View>
                ) : null}
                {selectedItem.unitPrice ? (
                  <View style={styles.actionDetailRow}>
                    <Text style={styles.actionDetailLabel}>Đơn giá:</Text>
                    <Text style={styles.actionDetailValue}>
                      {selectedItem.unitPriceFormatted || selectedItem.unitPrice.toLocaleString('vi-VN')} ₫
                    </Text>
                  </View>
                ) : null}
                <View style={styles.actionDetailRow}>
                  <Text style={styles.actionDetailLabel}>Tổng thanh toán:</Text>
                  <Text
                    style={[
                      styles.actionItemAmount,
                      selectedItem.isPaid ? { color: '#16A34A' } : { color: '#0F172A' },
                    ]}
                  >
                    {selectedItem.amountFormatted} ₫
                  </Text>
                </View>
                <View style={styles.actionDetailRow}>
                  <Text style={styles.actionDetailLabel}>Hình thức:</Text>
                  <Text style={styles.actionDetailValue}>{selectedItem.paymentMethodLabel}</Text>
                </View>
                <View style={styles.actionDetailRow}>
                  <Text style={styles.actionDetailLabel}>Trạng thái:</Text>
                  <Text
                    style={[
                      styles.actionDetailValue,
                      { fontWeight: '700', color: selectedItem.isPaid ? '#16A34A' : '#0F172A' },
                    ]}
                  >
                    {selectedItem.isPaid ? 'Đã thu tiền' : 'Chưa thu tiền'}
                  </Text>
                </View>
                <Text style={styles.actionItemDate}>
                  Ngày GD: {selectedItem.transactionDateFormatted || selectedItem.transactionDate}
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

      {/* ========================================================= */}
      {/* MODAL 4: DANH MỤC MẶT HÀNG KHỞI TẠO (KHO MẶT HÀNG) */}
      {/* ========================================================= */}
      <Modal
        visible={showCatalogModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCatalogModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCatalogModal(false)}
        >
          <View style={styles.catalogModalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.catalogIconBadge}>
                  <Ionicons name="cube-outline" size={18} color="#0284C7" />
                </View>
                <Text style={styles.modalTitle}>Danh mục mặt hàng khởi tạo</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCatalogModal(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.catalogSearchInput}
              placeholder="Tìm kiếm theo mã ID hoặc tên mặt hàng..."
              placeholderTextColor="#94A3B8"
              value={catalogSearch}
              onChangeText={setCatalogSearch}
            />

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 320 }}>
              {catalog
                .filter(
                  (p) =>
                    p.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                    p.id.toLowerCase().includes(catalogSearch.toLowerCase())
                )
                .map((prod) => (
                  <TouchableOpacity
                    key={prod.id}
                    style={styles.catalogItemRow}
                    onPress={() => handleSelectProduct(prod)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.catalogItemIdBadge}>
                      <Text style={styles.catalogItemIdText}>{prod.id}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.catalogItemName}>{prod.name}</Text>
                      {prod.unit ? (
                        <Text style={styles.catalogItemUnit}>Đơn vị tính: {prod.unit}</Text>
                      ) : null}
                    </View>
                    <Text style={styles.catalogItemPrice}>
                      {prod.price.toLocaleString('vi-VN')} ₫
                    </Text>
                    <Ionicons name="arrow-forward-circle" size={20} color="#059669" style={{ marginLeft: 8 }} />
                  </TouchableOpacity>
                ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.actionCloseBtn}
              onPress={() => setShowCatalogModal(false)}
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
    position: 'relative',
  },
  backgroundWatermarkBox: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    pointerEvents: 'none',
  },
  backgroundWatermark: {
    width: '100%',
    height: '100%',
    opacity: 0.28, // Mờ nhẹ nhàng, không bị chói mắt
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 42 : 10,
    paddingBottom: 10,
    backgroundColor: 'transparent',
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
    backgroundColor: 'rgba(243, 250, 246, 0.45)', // Nền trong suốt
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
    backgroundColor: 'rgba(232, 253, 240, 0.55)',
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
    backgroundColor: 'rgba(222, 249, 231, 0.65)',
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
    backgroundColor: 'rgba(222, 249, 231, 0.65)',
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
    backgroundColor: 'rgba(236, 253, 245, 0.90)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.50)',
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    overflow: 'hidden',
    width: '100%',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(248, 250, 252, 0.75)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.50)',
    minHeight: 40,
    alignItems: 'center',
  },
  tableDataRowEven: {
    backgroundColor: 'rgba(249, 252, 250, 0.35)',
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
  actionDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  actionDetailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  actionDetailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },

  // Subtext tên hàng trong bảng chính
  cellProductSubText: {
    fontSize: 9,
    fontStyle: 'italic',
    marginTop: 1,
    opacity: 0.85,
  },

  // Huy hiệu STT tự nhảy
  sttBadgeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  sttBadgeLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#059669',
  },
  sttBadgeNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#047857',
  },
  modalSubTitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },

  // Field header và Checkbox Khách lẻ
  fieldHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  retailCheckboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  retailCheckboxContainerActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  checkboxBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  checkboxBoxActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  retailCheckboxLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  retailCheckboxLabelActive: {
    color: '#047857',
    fontWeight: '700',
  },

  // Input có icon
  inputWithIconContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputLeftIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  formInputWithIcon: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingLeft: 38,
    paddingRight: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  formInputRetailActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
    fontWeight: '700',
    color: '#047857',
  },
  retailTagBadge: {
    position: 'absolute',
    right: 10,
    backgroundColor: '#DCFCE7',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  retailTagBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },

  // Kho mặt hàng link
  catalogLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  catalogLinkText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#0284C7',
    marginLeft: 4,
  },

  // Gợi ý nhanh mặt hàng khởi tạo
  presetCatalogSection: {
    marginTop: 6,
    marginBottom: 6,
  },
  presetSectionLabel: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#64748B',
    marginBottom: 4,
  },
  presetChipsScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  presetChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  presetChipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  presetChipText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '500',
  },
  presetChipTextActive: {
    color: '#065F46',
    fontWeight: '700',
  },
  presetChipPrice: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '600',
    marginTop: 1,
  },
  presetChipPriceActive: {
    color: '#047857',
    fontWeight: '800',
  },

  // Hàng 2 cột (Số lượng & Đơn giá)
  formRowTwoCols: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  formCol: {
    flex: 1,
  },
  autoPriceHint: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  formInputAutoPrice: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
    fontWeight: '700',
    color: '#065F46',
  },

  // Stepper số lượng (Mũi tên lên ▲ / xuống ▼)
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    overflow: 'hidden',
    height: 42,
  },
  stepperBtn: {
    width: 36,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2E8F0',
  },
  stepperInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    paddingVertical: 6,
  },

  // Thẻ thành tiền
  lineTotalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E6F4EA',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginTop: 10,
    marginBottom: 4,
  },
  lineTotalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
  },
  lineTotalFormula: {
    fontSize: 12.5,
    color: '#334155',
  },
  lineTotalHighlight: {
    fontSize: 14,
    fontWeight: '800',
    color: '#047857',
  },

  // Radio button chọn 1 trong 2
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  radioCircleActive: {
    borderColor: '#059669',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#059669',
  },

  // Bảng xem trước đơn hàng (Mini table preview)
  orderPreviewBox: {
    marginTop: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 10,
  },
  previewBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  previewBoxTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
  },
  miniTable: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  miniTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#EDF2F7',
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    alignItems: 'center',
  },
  miniHeaderCell: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
  },
  miniTableRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  miniDataCell: {
    fontSize: 10.5,
    color: '#0F172A',
    textAlign: 'center',
  },
  grandTotalBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#DEF7EC',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065F46',
  },
  grandTotalValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#047857',
  },

  // Checkbox lưu vào kho mặt hàng
  saveCatalogCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 4,
  },
  saveCatalogCheckText: {
    fontSize: 11.5,
    color: '#475569',
    flex: 1,
  },

  // Modal Kho mặt hàng khởi tạo
  catalogModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  catalogIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  catalogSearchInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    marginBottom: 10,
    color: '#0F172A',
  },
  catalogItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  catalogItemIdBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catalogItemIdText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  catalogItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  catalogItemUnit: {
    fontSize: 10,
    color: '#64748B',
  },
  catalogItemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
});

