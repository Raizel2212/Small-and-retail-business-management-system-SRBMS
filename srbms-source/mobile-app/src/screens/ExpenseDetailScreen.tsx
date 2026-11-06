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
import { expenseApi } from '../api/expenseApi';
import { ExpenseSummary, ExpenseItem, CreateExpensePayload, ProductSuggestion } from '../types/expense';

interface ExpenseDetailScreenProps {
  onBack: () => void;
}

type PeriodType = 'month' | 'quarter' | 'year' | 'all';

export const ExpenseDetailScreen: React.FC<ExpenseDetailScreenProps> = ({ onBack }) => {
  // State quản lý dữ liệu
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [summaryData, setSummaryData] = useState<ExpenseSummary | null>(null);
  const [period, setPeriod] = useState<PeriodType>('month');

  // Modals
  const [showPeriodModal, setShowPeriodModal] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showSuggestionsModal, setShowSuggestionsModal] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<ExpenseItem | null>(null);
  const [showActionModal, setShowActionModal] = useState<boolean>(false);

  // Gợi ý sản phẩm từ lịch sử nhập hàng
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [suggestionSearch, setSuggestionSearch] = useState<string>('');

  // Form State tạo thêm chi phí vào danh sách
  const [formProductName, setFormProductName] = useState<string>('');
  const [formQuantity, setFormQuantity] = useState<string>('1');
  const [formUnitPrice, setFormUnitPrice] = useState<string>('');
  const [formUnit, setFormUnit] = useState<string>('cái');
  const [formSupplierName, setFormSupplierName] = useState<string>('');
  const [formDate, setFormDate] = useState<string>('');
  const [formPaymentMethod, setFormPaymentMethod] = useState<'TIEN_MAT' | 'CHUYEN_KHOAN'>('TIEN_MAT');
  const [formPaymentStatus, setFormPaymentStatus] = useState<'DA_THANH_TOAN' | 'CHUA_THANH_TOAN'>('DA_THANH_TOAN');
  const [formNote, setFormNote] = useState<string>('');
  const [showAdvancedFields, setShowAdvancedFields] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Tải dữ liệu chi phí từ Backend & Local storage
  const loadExpenseData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await expenseApi.getExpenseSummary(period);
      setSummaryData(data);
    } catch (error: any) {
      console.warn('Lỗi tải dữ liệu chi phí:', error?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  // Tải danh sách gợi ý sản phẩm
  const loadSuggestions = useCallback(async () => {
    try {
      const list = await expenseApi.getProductSuggestions();
      setSuggestions(list);
    } catch (error) {
      // Bỏ qua
    }
  }, []);

  useEffect(() => {
    loadExpenseData();
    loadSuggestions();
  }, [loadExpenseData, loadSuggestions]);

  // Danh sách items hiện tại
  const items = summaryData?.items || [];

  // STT tự động nhảy đến số tiếp theo
  const nextSttNumber = items.length + 1;
  const nextSttFormatted = nextSttNumber.toString().padStart(2, '0');

  // Tính toán TỰ ĐỘNG THÀNH TIỀN = số lượng * đơn giá theo thời gian thực (realtime)
  const parsedUnitPrice = parseFloat(formUnitPrice.replace(/[^0-9]/g, '')) || 0;
  const currentQuantity = parseInt(formQuantity, 10) || 0;
  const computedTotalAmount = currentQuantity * parsedUnitPrice;
  const computedTotalFormatted = computedTotalAmount.toLocaleString('vi-VN');

  // Reset form khi mở Modal tạo chi phí mới
  const handleOpenCreateModal = () => {
    const today = new Date();
    const formattedToday = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;

    setFormProductName('');
    setFormQuantity('1');
    setFormUnitPrice('');
    setFormUnit('cái');
    setFormSupplierName('Đại lý / Nhà phân phối');
    setFormDate(formattedToday);
    setFormPaymentMethod('TIEN_MAT');
    setFormPaymentStatus('DA_THANH_TOAN');
    setFormNote('');
    setShowAdvancedFields(false);
    setShowCreateModal(true);
  };

  // Chọn sản phẩm gợi ý
  const handleSelectSuggestion = (prod: ProductSuggestion) => {
    setFormProductName(prod.productName);
    if (prod.unit) {
      setFormUnit(prod.unit);
    }
    if (prod.latestCostPrice) {
      setFormUnitPrice(prod.latestCostPrice.toLocaleString('vi-VN'));
    }
    if (prod.lastSupplier) {
      setFormSupplierName(prod.lastSupplier);
    }
    setShowSuggestionsModal(false);
  };

  // Khi người dùng gõ tên sản phẩm, tìm kiếm gợi ý giá nếu có
  const handleProductNameChange = (text: string) => {
    setFormProductName(text);
    const trimmed = text.trim().toLowerCase();
    const match = suggestions.find((s) => s.productName.trim().toLowerCase() === trimmed);
    if (match && match.latestCostPrice && !formUnitPrice) {
      setFormUnitPrice(match.latestCostPrice.toLocaleString('vi-VN'));
      if (match.unit) setFormUnit(match.unit);
      if (match.lastSupplier) setFormSupplierName(match.lastSupplier);
    }
  };

  // Tăng số lượng (+1)
  const handleQuantityIncrease = () => {
    const cur = parseInt(formQuantity, 10) || 0;
    setFormQuantity((cur + 1).toString());
  };

  // Giảm số lượng (-1, tối thiểu 1)
  const handleQuantityDecrease = () => {
    const cur = parseInt(formQuantity, 10) || 1;
    setFormQuantity(Math.max(1, cur - 1).toString());
  };

  // Thay đổi số lượng từ bàn phím
  const handleQuantityChange = (text: string) => {
    const clean = text.replace(/[^0-9]/g, '');
    if (clean === '') {
      setFormQuantity('');
      return;
    }
    const val = parseInt(clean, 10);
    setFormQuantity(val.toString());
  };

  // Nhập đơn giá (tự động format định dạng số tiền VNĐ: 180.000)
  const handleUnitPriceChange = (text: string) => {
    const cleanNumber = text.replace(/[^0-9]/g, '');
    if (cleanNumber === '') {
      setFormUnitPrice('');
      return;
    }
    const num = parseInt(cleanNumber, 10);
    setFormUnitPrice(num.toLocaleString('vi-VN'));
  };

  // Submit tạo chi phí mới gửi lên Backend & lưu vào Local Storage
  const handleSubmitCreate = async () => {
    if (!formProductName.trim()) {
      Alert.alert('Chưa đủ thông tin', 'Vui lòng nhập tên mặt hàng.');
      return;
    }

    if (currentQuantity <= 0) {
      Alert.alert('Số lượng không hợp lệ', 'Số lượng nhập phải lớn hơn hoặc bằng 1.');
      return;
    }

    if (parsedUnitPrice < 0) {
      Alert.alert('Đơn giá không hợp lệ', 'Đơn giá không được âm.');
      return;
    }

    // Chuyển đổi định dạng ngày dd/MM/yyyy sang YYYY-MM-DD
    let transactionDatePayload: string | undefined = undefined;
    if (formDate && formDate.includes('/')) {
      const parts = formDate.split('/');
      if (parts.length === 3) {
        transactionDatePayload = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }

    const payload: CreateExpensePayload = {
      productName: formProductName.trim(),
      supplierName: formSupplierName.trim() || 'Đại lý / Nhà phân phối',
      quantity: currentQuantity,
      unitPrice: parsedUnitPrice,
      amount: computedTotalAmount,
      unit: formUnit.trim() || 'cái',
      category: 'HANG_HOA',
      transactionDate: transactionDatePayload,
      paymentMethod: formPaymentMethod,
      paymentStatus: formPaymentStatus,
      note: formNote.trim() || undefined,
    };

    setSubmitting(true);
    try {
      await expenseApi.createExpense(payload);
      
      // Tải lại dữ liệu ngay lập tức để cập nhật danh sách và tổng chi phí
      const freshData = await expenseApi.getExpenseSummary(period);
      setSummaryData(freshData);

      setShowCreateModal(false);
      Alert.alert('Thành công', `Đã thêm mặt hàng "${formProductName}" vào danh sách chi phí!`);
      loadSuggestions();
    } catch (error: any) {
      Alert.alert('Lỗi thêm chi phí', error?.message || 'Không thể lưu khoản chi phí. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  // Đổi trạng thái thanh toán
  const handleToggleStatus = async (item: ExpenseItem) => {
    try {
      await expenseApi.togglePaymentStatus(item.id);
      setShowActionModal(false);
      const freshData = await expenseApi.getExpenseSummary(period);
      setSummaryData(freshData);
    } catch (error: any) {
      Alert.alert('Lỗi', error?.message || 'Không thể cập nhật trạng thái thanh toán.');
    }
  };

  // Xóa khoản chi phí
  const handleDeleteExpense = (item: ExpenseItem) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc chắn muốn xóa mặt hàng "${item.productName}" khỏi danh sách chi phí không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await expenseApi.deleteExpense(item.id);
              setShowActionModal(false);
              const freshData = await expenseApi.getExpenseSummary(period);
              setSummaryData(freshData);
              Alert.alert('Thành công', 'Đã xóa khoản chi phí thành công.');
            } catch (error: any) {
              Alert.alert('Lỗi', error?.message || 'Không thể xóa khoản chi.');
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
        return summaryData?.periodLabel || 'Tháng này';
      case 'quarter':
        return summaryData?.periodLabel || 'Quý này';
      case 'year':
        return summaryData?.periodLabel || 'Năm nay';
      case 'all':
        return 'Tất cả kỳ';
      default:
        return 'Tháng/Quý/ Năm';
    }
  };

  // Tính số dòng trống kẻ ô mô phỏng sổ kế toán cho đủ 7 dòng như Doanh thu
  const minRows = 7;
  const emptyRowsCount = Math.max(0, minRows - items.length);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Watermark Background Trống đồng Đông Sơn & Bản đồ Việt Nam trong suốt xuyên qua card */}
      <View style={styles.backgroundWatermarkBox} pointerEvents="none">
        <Image
          source={require('../../assets/trong_dong_map_bg.png')}
          style={styles.backgroundWatermark}
          resizeMode="cover"
        />
      </View>

      {/* Top Header Bar điều hướng: ĐÃ HẠ THẤP XUỐNG DƯỚI TAI THỎ / DYNAMIC ISLAND ĐỂ KHÔNG BỊ CHE */}
      <View style={styles.navHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
          <Text style={styles.backText}>Trang chủ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => loadExpenseData(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="reload-outline" size={18} color="#DC2626" />
          <Text style={styles.refreshText}>Làm mới</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadExpenseData(true)}
            colors={['#DC2626']}
            tintColor="#DC2626"
          />
        }
      >
        {/* KHUNG THIẾT KẾ CHI PHÍ BÁN TRONG SUỐT NHƯ DOANH THU */}
        <View style={styles.mainCard}>
          {/* 1. Header Tiêu đề "Chi phí" (Nền đỏ nhạt trong suốt hài hòa) */}
          <View style={styles.titleBanner}>
            <Text style={styles.titleBannerText}>Chi phí</Text>
          </View>

          {/* 2. Hàng Chọn Tháng/Quý/ Năm & Tổng số tiền chi phí lớn */}
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

            {/* Số tiền tổng lớn (lấy từ dữ liệu thực tế) */}
            <View style={styles.totalBigContainer}>
              <Text style={styles.totalBigNumber} numberOfLines={1}>
                {summaryData?.totalExpenseFormatted || '0'}
              </Text>
            </View>
          </View>

          {/* 3. Khung Bảng Tổng Hợp Chi Phí (Nền bán trong suốt) */}
          <View style={styles.summaryTable}>
            {/* Cột trái: "Tổng chi bằng" & Cột phải: Tiền mặt, Chuyển khoản */}
            <View style={styles.summaryRowTop}>
              <View style={styles.summaryColLeft}>
                <Text style={styles.summaryColLeftText}>Tổng chi bằng</Text>
              </View>

              <View style={styles.summaryColRight}>
                {/* Hàng Tiền mặt */}
                <View style={styles.summarySubRow}>
                  <Text style={styles.summarySubLabel}>Tiền mặt:</Text>
                  <Text style={styles.summarySubValue}>
                    {summaryData?.totalCashFormatted || '0'}
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

            {/* Hàng dưới: "Tổng số tiền chưa thanh toán:" */}
            <View style={styles.summaryRowBottom}>
              <Text style={styles.unpaidLabel}>Tổng số tiền chưa thanh toán:</Text>
              <Text style={styles.unpaidValue}>
                {summaryData?.totalUnpaidFormatted || '0'}
              </Text>
            </View>
          </View>

          {/* 4. Nút "+ Tạo mới" chi phí */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.createBtn}
              onPress={handleOpenCreateModal}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={18} color="#DC2626" style={{ marginRight: 4 }} />
              <Text style={styles.createBtnText}>Tạo mới</Text>
            </TouchableOpacity>
          </View>

          {/* 5. BẢNG DANH SÁCH CHI PHÍ ĐỦ TRỌN VẸN 5 CỘT: */}
          {/* STT | TÊN MẶT HÀNG | SL | ĐƠN GIÁ | THÀNH TIỀN (SỐ LƯỢNG * ĐƠN GIÁ) */}
          <View style={styles.tableContainer}>
            {/* Header cột của bảng */}
            <View style={styles.tableHeaderRow}>
              <View style={[styles.cell, styles.colStt]}>
                <Text style={styles.headerText}>STT</Text>
              </View>
              <View style={[styles.cell, styles.colProductName]}>
                <Text style={styles.headerText}>Tên mặt hàng</Text>
              </View>
              <View style={[styles.cell, styles.colQuantity]}>
                <Text style={styles.headerText}>SL</Text>
              </View>
              <View style={[styles.cell, styles.colUnitPrice]}>
                <Text style={styles.headerText}>Đơn giá</Text>
              </View>
              <View style={[styles.cell, styles.colAmount]}>
                <Text style={styles.headerText}>Thành tiền</Text>
              </View>
            </View>

            {/* Danh sách các dòng dữ liệu */}
            {loading && !refreshing && items.length === 0 ? (
              <View style={styles.tableLoading}>
                <ActivityIndicator size="small" color="#DC2626" />
                <Text style={styles.tableLoadingText}>Đang tải danh sách chi phí...</Text>
              </View>
            ) : (
              <>
                {items.map((item, index) => {
                  const rowNumber = (item.stt || index + 1).toString().padStart(2, '0');
                  const isPaid = item.isPaid ?? (item.paymentStatus === 'DA_THANH_TOAN' || item.paymentStatus === 'DA_CHI');
                  // Dòng màu xanh nếu đã thanh toán, màu đen nếu chưa thanh toán (đồng bộ Doanh thu)
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
                      {/* Cột 1: STT có tam giác ở góc */}
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

                      {/* Cột 2: Tên mặt hàng */}
                      <View style={[styles.cell, styles.colProductName]}>
                        <Text
                          style={[styles.cellProductNameText, { color: rowTextColor }]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {item.productName}
                        </Text>
                        {item.supplierName && item.supplierName !== 'Đại lý / Nhà phân phối' ? (
                          <Text
                            style={[styles.cellSubText, { color: rowTextColor }]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            NCC: {item.supplierName}
                          </Text>
                        ) : null}
                      </View>

                      {/* Cột 3: Số lượng */}
                      <View style={[styles.cell, styles.colQuantity]}>
                        <Text style={[styles.cellTextBase, { color: rowTextColor }]}>
                          {item.quantity}
                        </Text>
                        {item.unit ? (
                          <Text style={[styles.cellUnitSubText, { color: rowTextColor }]}>
                            {item.unit}
                          </Text>
                        ) : null}
                      </View>

                      {/* Cột 4: Đơn giá */}
                      <View style={[styles.cell, styles.colUnitPrice]}>
                        <Text
                          style={[styles.cellTextRight, { color: rowTextColor }]}
                          numberOfLines={1}
                        >
                          {item.unitPriceFormatted || item.unitPrice?.toLocaleString('vi-VN')}
                        </Text>
                      </View>

                      {/* Cột 5: Thành tiền (Số lượng * Đơn giá) */}
                      <View style={[styles.cell, styles.colAmount]}>
                        <Text
                          style={[styles.cellAmountText, { color: rowTextColor }]}
                          numberOfLines={1}
                        >
                          {item.amountFormatted || item.amount?.toLocaleString('vi-VN')}
                        </Text>
                        <Text style={[styles.statusTagText, { color: rowTextColor }]}>
                          {isPaid ? 'đã chi' : 'chưa chi'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}

                {/* Các dòng trống mô phỏng sổ kẻ ô giống hệt Doanh thu */}
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
                      <View style={[styles.cell, styles.colProductName]} />
                      <View style={[styles.cell, styles.colQuantity]} />
                      <View style={[styles.cell, styles.colUnitPrice]} />
                      <View style={[styles.cell, styles.colAmount]} />
                    </View>
                  );
                })}

                {/* ======================================================== */}
                {/* 6. BÊN DƯỚI CÙNG CỦA DANH SÁCH: TỔNG CHI PHÍ */}
                {/* ======================================================== */}
                <View style={styles.tableFooterRow}>
                  {/* Gộp STT và Tên mặt hàng cho nhãn TỔNG CHI PHÍ */}
                  <View style={[styles.cell, styles.colFooterLabel]}>
                    <Text style={styles.footerLabelText}>TỔNG CHI PHÍ</Text>
                    <Text style={styles.footerSubText}>
                      ({items.length} mặt hàng)
                    </Text>
                  </View>

                  {/* Tổng số lượng */}
                  <View style={[styles.cell, styles.colQuantity]}>
                    <Text style={styles.footerQuantityText}>
                      {summaryData?.totalQuantity ?? items.reduce((acc, it) => acc + (it.quantity || 0), 0)}
                    </Text>
                  </View>

                  {/* Đơn giá trung bình / để trống */}
                  <View style={[styles.cell, styles.colUnitPrice]}>
                    <Text style={styles.footerDashText}>-</Text>
                  </View>

                  {/* TỔNG THÀNH TIỀN (TỔNG CHI PHÍ) */}
                  <View style={[styles.cell, styles.colAmount]}>
                    <Text style={styles.footerTotalAmountText} numberOfLines={1}>
                      {summaryData?.totalExpenseFormatted || '0'}
                    </Text>
                    <Text style={styles.footerVndText}>VNĐ</Text>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Ghi chú hướng dẫn ở đáy bảng */}
          <View style={styles.instructionBox}>
            <View style={styles.instructionItem}>
              <View style={[styles.legendDot, { backgroundColor: '#16A34A' }]} />
              <Text style={styles.instructionText}>
                Toàn bộ dòng màu xanh lá: <Text style={{ fontWeight: '700', color: '#16A34A' }}>Đã chi tiền</Text>
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <View style={[styles.legendDot, { backgroundColor: '#0F172A' }]} />
              <Text style={styles.instructionText}>
                Toàn bộ dòng màu đen: <Text style={{ fontWeight: '700', color: '#0F172A' }}>Chưa thanh toán</Text>
              </Text>
            </View>
            <Text style={styles.instructionSubtext}>
              * Nhấn vào từng dòng để đổi trạng thái chi tiền hoặc xóa khoản chi
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
          <View style={styles.periodModalCard}>
            <View style={styles.periodModalHeader}>
              <Text style={styles.periodModalTitle}>Chọn kỳ xem chi phí</Text>
              <TouchableOpacity onPress={() => setShowPeriodModal(false)}>
                <Ionicons name="close" size={20} color="#64748B" />
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
                color={period === 'month' ? '#DC2626' : '#64748B'}
              />
              <Text
                style={[
                  styles.periodOptionText,
                  period === 'month' && styles.periodOptionTextSelected,
                ]}
              >
                Tháng hiện tại
              </Text>
              {period === 'month' && (
                <Ionicons name="checkmark-circle" size={20} color="#DC2626" />
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
                color={period === 'quarter' ? '#DC2626' : '#64748B'}
              />
              <Text
                style={[
                  styles.periodOptionText,
                  period === 'quarter' && styles.periodOptionTextSelected,
                ]}
              >
                Quý hiện tại
              </Text>
              {period === 'quarter' && (
                <Ionicons name="checkmark-circle" size={20} color="#DC2626" />
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
                name="trending-down-outline"
                size={20}
                color={period === 'year' ? '#DC2626' : '#64748B'}
              />
              <Text
                style={[
                  styles.periodOptionText,
                  period === 'year' && styles.periodOptionTextSelected,
                ]}
              >
                Cả năm hiện tại
              </Text>
              {period === 'year' && (
                <Ionicons name="checkmark-circle" size={20} color="#DC2626" />
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
                color={period === 'all' ? '#DC2626' : '#64748B'}
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
                <Ionicons name="checkmark-circle" size={20} color="#DC2626" />
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 2: TẠO THÊM CHI PHÍ VÀO DANH SÁCH (STT TỰ NHẢY) */}
      {/* USER NHẬP TÊN, SỐ LƯỢNG, ĐƠN GIÁ -> TỰ ĐỘNG THÀNH TIỀN */}
      {/* ========================================================= */}
      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.createModalCard}>
            {/* Header Modal với STT tự nhảy đến số tiếp theo */}
            <View style={styles.modalHeaderRow}>
              <View style={styles.createModalHeaderLeft}>
                <View style={styles.createIconBadge}>
                  <Ionicons name="receipt" size={18} color="#DC2626" />
                </View>
                <View style={styles.createModalTitleWrap}>
                  <Text style={styles.modalTitle} numberOfLines={1}>
                    Thêm chi phí nhập hàng
                  </Text>
                  <Text style={styles.modalSubTitle} numberOfLines={1}>
                    Hệ thống tự động tính thành tiền
                  </Text>
                </View>
              </View>

              <View style={styles.createModalHeaderRight}>
                {/* HUY HIỆU STT TỰ NHẢY ĐẾN SỐ TIẾP THEO */}
                <View style={styles.sttBadgeContainer}>
                  <Text style={styles.sttBadgeLabel}>STT TIẾP</Text>
                  <Text style={styles.sttBadgeNumber}>{nextSttFormatted}</Text>
                </View>

                <TouchableOpacity
                  onPress={() => setShowCreateModal(false)}
                  style={styles.createModalCloseBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={22} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }}>
              {/* 1. TÊN MẶT HÀNG (BẮT BUỘC) */}
              <View style={styles.fieldHeaderRow}>
                <Text style={styles.formLabel}>Tên mặt hàng *</Text>
                {suggestions.length > 0 && (
                  <TouchableOpacity
                    style={styles.suggestionLinkBtn}
                    onPress={() => setShowSuggestionsModal(true)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="bulb-outline" size={14} color="#DC2626" />
                    <Text style={styles.suggestionLinkText}>Gợi ý hàng đã nhập ({suggestions.length})</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.inputWithIconContainer}>
                <Ionicons
                  name="cube-outline"
                  size={18}
                  color="#DC2626"
                  style={styles.inputLeftIcon}
                />
                <TextInput
                  style={styles.formInputWithIcon}
                  placeholder="Nhập tên mặt hàng (ví dụ: Cà phê Robusta...)"
                  placeholderTextColor="#94A3B8"
                  value={formProductName}
                  onChangeText={handleProductNameChange}
                />
              </View>

              {/* HÀNG GỒM: SỐ LƯỢNG & ĐƠN VỊ TÍNH */}
              <View style={styles.formRowTwoCols}>
                {/* 2. SỐ LƯỢNG (CÓ NÚT TĂNG GIẢM ▲ ▼) */}
                <View style={styles.colHalf}>
                  <Text style={styles.formLabel}>Số lượng *</Text>
                  <View style={styles.quantityInputContainer}>
                    <TouchableOpacity
                      style={styles.quantityStepBtn}
                      onPress={handleQuantityDecrease}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="remove" size={18} color="#475569" />
                    </TouchableOpacity>
                    <TextInput
                      style={styles.quantityTextInput}
                      keyboardType="numeric"
                      value={formQuantity}
                      onChangeText={handleQuantityChange}
                      placeholder="1"
                      placeholderTextColor="#94A3B8"
                      textAlign="center"
                    />
                    <TouchableOpacity
                      style={styles.quantityStepBtn}
                      onPress={handleQuantityIncrease}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="add" size={18} color="#475569" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* ĐƠN VỊ TÍNH */}
                <View style={styles.colHalf}>
                  <Text style={styles.formLabel}>Đơn vị tính</Text>
                  <TextInput
                    style={styles.formInputSimple}
                    placeholder="cái, kg, hộp..."
                    placeholderTextColor="#94A3B8"
                    value={formUnit}
                    onChangeText={setFormUnit}
                  />
                </View>
              </View>

              {/* 3. ĐƠN GIÁ (NHẬP SỐ TIỀN) */}
              <View style={{ marginTop: 12 }}>
                <Text style={styles.formLabel}>Đơn giá nhập (VNĐ) *</Text>
                <View style={styles.inputWithIconContainer}>
                  <Ionicons
                    name="pricetag-outline"
                    size={18}
                    color="#DC2626"
                    style={styles.inputLeftIcon}
                  />
                  <TextInput
                    style={styles.formInputWithIcon}
                    keyboardType="numeric"
                    placeholder="Ví dụ: 180.000"
                    placeholderTextColor="#94A3B8"
                    value={formUnitPrice}
                    onChangeText={handleUnitPriceChange}
                  />
                  <Text style={styles.currencySuffix}>₫</Text>
                </View>
              </View>

              {/* ======================================================== */}
              {/* 4. TỰ ĐỘNG THÀNH TIỀN = SỐ LƯỢNG * ĐƠN GIÁ */}
              {/* ======================================================== */}
              <View style={styles.computedAmountBox}>
                <View style={styles.computedAmountLeft}>
                  <Text style={styles.computedAmountLabel}>THÀNH TIỀN (TỰ ĐỘNG)</Text>
                  <Text style={styles.computedAmountFormula}>
                    {currentQuantity} {formUnit || 'cái'} × {parsedUnitPrice.toLocaleString('vi-VN')} ₫
                  </Text>
                </View>
                <View style={styles.computedAmountRight}>
                  <Text style={styles.computedAmountValue}>
                    {computedTotalFormatted}
                  </Text>
                  <Text style={styles.computedAmountUnit}>₫</Text>
                </View>
              </View>

              {/* TÙY CHỌN MỞ RỘNG (Nhà cung cấp, Ngày, Phương thức, Ghi chú) */}
              <TouchableOpacity
                style={styles.advancedToggleBtn}
                onPress={() => setShowAdvancedFields(!showAdvancedFields)}
                activeOpacity={0.7}
              >
                <Text style={styles.advancedToggleText}>
                  {showAdvancedFields ? 'Thu gọn thông tin phụ' : '+ Thông tin nhà cung cấp, thanh toán...'}
                </Text>
                <Ionicons
                  name={showAdvancedFields ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color="#64748B"
                />
              </TouchableOpacity>

              {showAdvancedFields && (
                <View style={styles.advancedSection}>
                  {/* Tên nhà cung cấp */}
                  <View style={{ marginBottom: 12 }}>
                    <Text style={styles.formLabel}>Nhà cung cấp / Người bán</Text>
                    <TextInput
                      style={styles.formInputSimple}
                      placeholder="Đại lý phân phối..."
                      placeholderTextColor="#94A3B8"
                      value={formSupplierName}
                      onChangeText={setFormSupplierName}
                    />
                  </View>

                  {/* Ngày giao dịch */}
                  <View style={{ marginBottom: 12 }}>
                    <Text style={styles.formLabel}>Ngày nhập hàng (dd/mm/yyyy)</Text>
                    <TextInput
                      style={styles.formInputSimple}
                      placeholder="dd/mm/yyyy"
                      placeholderTextColor="#94A3B8"
                      value={formDate}
                      onChangeText={setFormDate}
                    />
                  </View>

                  {/* Phương thức thanh toán */}
                  <View style={{ marginBottom: 12 }}>
                    <Text style={styles.formLabel}>Phương thức thanh toán</Text>
                    <View style={styles.methodToggleRow}>
                      <TouchableOpacity
                        style={[
                          styles.methodToggleBtn,
                          formPaymentMethod === 'TIEN_MAT' && styles.methodToggleBtnActive,
                        ]}
                        onPress={() => setFormPaymentMethod('TIEN_MAT')}
                      >
                        <Ionicons
                          name="cash-outline"
                          size={16}
                          color={formPaymentMethod === 'TIEN_MAT' ? '#DC2626' : '#64748B'}
                        />
                        <Text
                          style={[
                            styles.methodToggleText,
                            formPaymentMethod === 'TIEN_MAT' && styles.methodToggleTextActive,
                          ]}
                        >
                          Tiền mặt
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.methodToggleBtn,
                          formPaymentMethod === 'CHUYEN_KHOAN' && styles.methodToggleBtnActive,
                        ]}
                        onPress={() => setFormPaymentMethod('CHUYEN_KHOAN')}
                      >
                        <Ionicons
                          name="card-outline"
                          size={16}
                          color={formPaymentMethod === 'CHUYEN_KHOAN' ? '#DC2626' : '#64748B'}
                        />
                        <Text
                          style={[
                            styles.methodToggleText,
                            formPaymentMethod === 'CHUYEN_KHOAN' && styles.methodToggleTextActive,
                          ]}
                        >
                          Chuyển khoản
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Trạng thái thanh toán */}
                  <View style={{ marginBottom: 12 }}>
                    <Text style={styles.formLabel}>Trạng thái thanh toán</Text>
                    <View style={styles.methodToggleRow}>
                      <TouchableOpacity
                        style={[
                          styles.methodToggleBtn,
                          formPaymentStatus === 'DA_THANH_TOAN' && styles.methodToggleBtnPaidActive,
                        ]}
                        onPress={() => setFormPaymentStatus('DA_THANH_TOAN')}
                      >
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={16}
                          color={formPaymentStatus === 'DA_THANH_TOAN' ? '#059669' : '#64748B'}
                        />
                        <Text
                          style={[
                            styles.methodToggleText,
                            formPaymentStatus === 'DA_THANH_TOAN' && styles.methodToggleTextPaidActive,
                          ]}
                        >
                          Đã thanh toán
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.methodToggleBtn,
                          formPaymentStatus === 'CHUA_THANH_TOAN' && styles.methodToggleBtnUnpaidActive,
                        ]}
                        onPress={() => setFormPaymentStatus('CHUA_THANH_TOAN')}
                      >
                        <Ionicons
                          name="time-outline"
                          size={16}
                          color={formPaymentStatus === 'CHUA_THANH_TOAN' ? '#B91C1C' : '#64748B'}
                        />
                        <Text
                          style={[
                            styles.methodToggleText,
                            formPaymentStatus === 'CHUA_THANH_TOAN' && styles.methodToggleTextUnpaidActive,
                          ]}
                        >
                          Chưa thanh toán
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Ghi chú */}
                  <View style={{ marginBottom: 12 }}>
                    <Text style={styles.formLabel}>Ghi chú</Text>
                    <TextInput
                      style={styles.formInputSimple}
                      placeholder="Ghi chú thêm về lô hàng..."
                      placeholderTextColor="#94A3B8"
                      value={formNote}
                      onChangeText={setFormNote}
                    />
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Hàng nút bấm Hủy & Thêm vào danh sách */}
            <View style={styles.modalActionButtonsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowCreateModal(false)}
                disabled={submitting}
              >
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitCreateBtn, submitting && styles.submitBtnDisabled]}
                onPress={handleSubmitCreate}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-sharp" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.submitCreateBtnText}>Thêm vào danh sách</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 3: GỢI Ý MẶT HÀNG ĐÃ NHẬP */}
      {/* ========================================================= */}
      <Modal
        visible={showSuggestionsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuggestionsModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSuggestionsModal(false)}
        >
          <View style={styles.suggestionModalCard}>
            <View style={styles.suggestionModalHeader}>
              <View>
                <Text style={styles.periodModalTitle}>Gợi ý mặt hàng</Text>
                <Text style={styles.modalSubTitle}>Bấm chọn để tự điền tên và đơn giá</Text>
              </View>
              <TouchableOpacity onPress={() => setShowSuggestionsModal(false)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Tìm kiếm */}
            <View style={styles.suggestionSearchBox}>
              <Ionicons name="search" size={16} color="#94A3B8" style={{ marginRight: 6 }} />
              <TextInput
                style={styles.suggestionSearchInput}
                placeholder="Tìm tên mặt hàng..."
                placeholderTextColor="#94A3B8"
                value={suggestionSearch}
                onChangeText={setSuggestionSearch}
              />
            </View>

            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {suggestions
                .filter((s) => s.productName.toLowerCase().includes(suggestionSearch.toLowerCase()))
                .map((sug) => (
                  <TouchableOpacity
                    key={sug.id}
                    style={styles.suggestionItemRow}
                    onPress={() => handleSelectSuggestion(sug)}
                  >
                    <View style={styles.suggestionItemLeft}>
                      <Text style={styles.suggestionItemName}>{sug.productName}</Text>
                      <Text style={styles.suggestionItemSub}>
                        {sug.lastSupplier ? `NCC: ${sug.lastSupplier}` : 'Hàng nhập gần đây'}
                      </Text>
                    </View>
                    <View style={styles.suggestionItemRight}>
                      <Text style={styles.suggestionItemPrice}>
                        {sug.latestCostPriceFormatted || sug.latestCostPrice?.toLocaleString('vi-VN')} ₫
                      </Text>
                      <Text style={styles.suggestionItemUnit}>/{sug.unit || 'cái'}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 4: CHI TIẾT & THAO TÁC CHO DÒNG ĐÃ CHỌN */}
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
            {selectedItem && (
              <>
                <View style={styles.actionModalHeader}>
                  <View>
                    <Text style={styles.actionModalTitle}>Chi tiết chi phí #{selectedItem.stt}</Text>
                    <Text style={styles.actionModalSub}>{selectedItem.transactionDateFormatted || selectedItem.transactionDate}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowActionModal(false)}>
                    <Ionicons name="close" size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>

                {/* Bảng thông tin chi tiết */}
                <View style={styles.actionDetailsBox}>
                  <View style={styles.actionDetailRow}>
                    <Text style={styles.actionDetailLabel}>Tên mặt hàng:</Text>
                    <Text style={styles.actionDetailValueBold}>{selectedItem.productName}</Text>
                  </View>
                  <View style={styles.actionDetailRow}>
                    <Text style={styles.actionDetailLabel}>Nhà cung cấp:</Text>
                    <Text style={styles.actionDetailValue}>{selectedItem.supplierName || 'Đại lý phân phối'}</Text>
                  </View>
                  <View style={styles.actionDetailRow}>
                    <Text style={styles.actionDetailLabel}>Số lượng & Đơn vị:</Text>
                    <Text style={styles.actionDetailValue}>{selectedItem.quantity} {selectedItem.unit || 'cái'}</Text>
                  </View>
                  <View style={styles.actionDetailRow}>
                    <Text style={styles.actionDetailLabel}>Đơn giá nhập:</Text>
                    <Text style={styles.actionDetailValue}>{selectedItem.unitPriceFormatted || selectedItem.unitPrice?.toLocaleString('vi-VN')} ₫</Text>
                  </View>
                  <View style={[styles.actionDetailRow, styles.actionDetailHighlight]}>
                    <Text style={styles.actionDetailLabelHighlight}>Thành tiền:</Text>
                    <Text style={styles.actionDetailValueHighlight}>{selectedItem.amountFormatted || selectedItem.amount?.toLocaleString('vi-VN')} ₫</Text>
                  </View>
                  <View style={styles.actionDetailRow}>
                    <Text style={styles.actionDetailLabel}>Phương thức:</Text>
                    <Text style={styles.actionDetailValue}>{selectedItem.paymentMethodLabel || (selectedItem.paymentMethod === 'CHUYEN_KHOAN' ? 'Chuyển khoản' : 'Tiền mặt')}</Text>
                  </View>
                  <View style={styles.actionDetailRow}>
                    <Text style={styles.actionDetailLabel}>Trạng thái:</Text>
                    <Text style={[styles.actionDetailValue, { color: selectedItem.isPaid ? '#059669' : '#DC2626', fontWeight: '700' }]}>
                      {selectedItem.paymentStatusLabel || (selectedItem.isPaid ? 'Đã chi tiền' : 'Chưa thanh toán')}
                    </Text>
                  </View>
                  {selectedItem.note ? (
                    <View style={styles.actionDetailRow}>
                      <Text style={styles.actionDetailLabel}>Ghi chú:</Text>
                      <Text style={styles.actionDetailValue}>{selectedItem.note}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Các nút thao tác */}
                <View style={styles.actionButtonsList}>
                  {/* Nút đổi trạng thái */}
                  <TouchableOpacity
                    style={[
                      styles.actionItemBtn,
                      { backgroundColor: selectedItem.isPaid ? '#FEF2F2' : '#ECFDF5' },
                    ]}
                    onPress={() => handleToggleStatus(selectedItem)}
                  >
                    <Ionicons
                      name={selectedItem.isPaid ? 'close-circle-outline' : 'checkmark-circle-outline'}
                      size={18}
                      color={selectedItem.isPaid ? '#DC2626' : '#059669'}
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      style={[
                        styles.actionItemBtnText,
                        { color: selectedItem.isPaid ? '#DC2626' : '#059669' },
                      ]}
                    >
                      {selectedItem.isPaid ? 'Đổi sang: Chưa thanh toán' : 'Đổi sang: Đã chi tiền'}
                    </Text>
                  </TouchableOpacity>

                  {/* Nút xóa khoản chi */}
                  <TouchableOpacity
                    style={[styles.actionItemBtn, { backgroundColor: '#FEE2E2', marginTop: 8 }]}
                    onPress={() => handleDeleteExpense(selectedItem)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#B91C1C" style={{ marginRight: 8 }} />
                    <Text style={[styles.actionItemBtnText, { color: '#B91C1C' }]}>
                      Xóa khỏi danh sách chi phí
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EDF7F2', // Nền màu xanh nhẹ thanh thoát giống Doanh thu
  },
  backgroundWatermarkBox: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
  },
  backgroundWatermark: {
    width: '120%',
    height: '100%',
    opacity: 0.32, // TĂNG ĐỘ RÕ HOA VĂN TRỐNG ĐỒNG VÀ BẢN ĐỒ VIỆT NAM
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    // HẠ THẤP XUỐNG 54px TRÊN WEB ĐỂ KHÔNG BỊ TAI THỎ / DYNAMIC ISLAND CHE MẤT
    paddingTop: Platform.OS === 'web' ? 54 : 32,
    paddingBottom: 10,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(203, 213, 225, 0.7)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  backText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginLeft: 5,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(254, 202, 202, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  refreshText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
    marginLeft: 5,
  },
  scrollContainer: {
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 36,
    zIndex: 1,
  },
  mainCard: {
    // NỀN TRONG SUỐT (40% OPACITY) ĐỒNG BỘ VỚI DOANH THU ĐỂ NHÌN RÕ HOA VĂN BÊN DƯỚI
    backgroundColor: 'rgba(243, 250, 246, 0.40)',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(191, 231, 211, 0.8)',
    padding: 8,
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  titleBanner: {
    backgroundColor: 'rgba(254, 226, 226, 0.75)',
    borderRadius: 6,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  titleBannerText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#B91C1C',
    letterSpacing: 0.5,
  },
  periodAndTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
    paddingHorizontal: 2,
    marginBottom: 8,
  },
  periodDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  periodDropdownText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  totalBigContainer: {
    flex: 1,
    alignItems: 'flex-end',
    marginLeft: 6,
  },
  totalBigNumber: {
    fontSize: 21,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: -0.5,
  },
  summaryTable: {
    borderWidth: 1.5,
    borderColor: 'rgba(252, 165, 165, 0.8)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 10,
    backgroundColor: 'rgba(255, 245, 245, 0.50)',
  },
  summaryRowTop: {
    flexDirection: 'row',
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(252, 165, 165, 0.8)',
  },
  summaryColLeft: {
    width: '38%',
    backgroundColor: 'rgba(254, 226, 226, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRightWidth: 1.5,
    borderRightColor: 'rgba(252, 165, 165, 0.8)',
  },
  summaryColLeftText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991B1C',
    textAlign: 'center',
  },
  summaryColRight: {
    width: '62%',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  summarySubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  summarySubLabel: {
    fontSize: 12,
    color: '#475569',
  },
  summarySubValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  summarySubDivider: {
    height: 1,
    backgroundColor: 'rgba(254, 202, 202, 0.6)',
  },
  summaryRowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(254, 242, 242, 0.70)',
  },
  unpaidLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#991B1B',
  },
  unpaidValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 8,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(254, 226, 226, 0.85)',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  createBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },

  /* BẢNG DANH SÁCH 5 CỘT: VỪA VẶN HOÀN TOÀN MÀN HÌNH KHÔNG BỊ TRÀN HAY MẤT CỘT */
  tableContainer: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.50)',
    width: '100%',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(241, 245, 249, 0.85)',
    borderBottomWidth: 1.5,
    borderBottomColor: '#CBD5E1',
    paddingVertical: 6,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  cell: {
    justifyContent: 'center',
    paddingHorizontal: 1,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  // KÍCH THƯỚC CÁC CỘT CHUẨN XÁC ĐẢM BẢO KHÔNG BỊ TRÀN
  colStt: {
    width: 28,
    alignItems: 'center',
  },
  colProductName: {
    flex: 1,
    minWidth: 74,
    paddingHorizontal: 3,
  },
  colQuantity: {
    width: 32,
    alignItems: 'center',
  },
  colUnitPrice: {
    width: 62,
    alignItems: 'flex-end',
    paddingRight: 3,
  },
  colAmount: {
    width: 74,
    alignItems: 'flex-end',
    paddingRight: 3,
    borderRightWidth: 0,
  },
  colFooterLabel: {
    flex: 1,
    minWidth: 102,
    paddingHorizontal: 4,
    alignItems: 'flex-start',
  },
  tableDataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: 'transparent',
    minHeight: 40,
    alignItems: 'center',
  },
  tableDataRowEven: {
    backgroundColor: 'rgba(248, 250, 252, 0.50)',
  },
  emptyRow: {
    minHeight: 32,
  },
  sttCellContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  triangleCorner: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 0,
    height: 0,
    borderTopWidth: 7,
    borderRightWidth: 7,
    borderTopColor: '#0F172A',
    borderRightColor: 'transparent',
  },
  cellTextBase: {
    fontSize: 10.5,
    fontWeight: '600',
    textAlign: 'center',
  },
  cellTextDark: {
    fontSize: 10.5,
    fontWeight: '500',
    color: '#94A3B8',
    textAlign: 'center',
  },
  cellProductNameText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  cellSubText: {
    fontSize: 8.5,
    opacity: 0.75,
    marginTop: 1,
  },
  cellUnitSubText: {
    fontSize: 7.5,
    opacity: 0.7,
  },
  cellTextRight: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'right',
  },
  cellAmountText: {
    fontSize: 10.5,
    fontWeight: '800',
    textAlign: 'right',
  },
  statusTagText: {
    fontSize: 7.5,
    opacity: 0.8,
    marginTop: 1,
    textTransform: 'lowercase',
  },

  /* FOOTER TỔNG CHI PHÍ */
  tableFooterRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(254, 242, 242, 0.85)',
    borderTopWidth: 2,
    borderTopColor: '#FECACA',
    minHeight: 42,
    alignItems: 'center',
  },
  footerLabelText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#B91C1C',
    letterSpacing: 0.3,
  },
  footerSubText: {
    fontSize: 8.5,
    color: '#7F1D1D',
  },
  footerQuantityText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#B91C1C',
    textAlign: 'center',
  },
  footerDashText: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'right',
  },
  footerTotalAmountText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#DC2626',
    textAlign: 'right',
  },
  footerVndText: {
    fontSize: 7.5,
    fontWeight: '700',
    color: '#DC2626',
    textAlign: 'right',
  },

  tableLoading: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableLoadingText: {
    marginTop: 5,
    fontSize: 11,
    color: '#64748B',
  },

  instructionBox: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 232, 240, 0.8)',
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  instructionText: {
    fontSize: 10,
    color: '#475569',
  },
  instructionSubtext: {
    fontSize: 9,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: 2,
  },

  /* MODAL STYLES */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  periodModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  periodModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  periodModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  periodOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: '#F8FAFC',
  },
  periodOptionSelected: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  periodOptionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
    marginLeft: 10,
  },
  periodOptionTextSelected: {
    fontWeight: '700',
    color: '#DC2626',
  },

  /* CREATE MODAL */
  createModalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  createModalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  createIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  createModalTitleWrap: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSubTitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  createModalHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sttBadgeContainer: {
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  sttBadgeLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FEE2E2',
  },
  sttBadgeNumber: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  createModalCloseBtn: {
    padding: 4,
  },
  fieldHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  suggestionLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionLinkText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
    marginLeft: 3,
  },
  inputWithIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    height: 44,
  },
  inputLeftIcon: {
    marginRight: 8,
  },
  formInputWithIcon: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 8,
  },
  currencySuffix: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    marginLeft: 4,
  },
  formRowTwoCols: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  colHalf: {
    flex: 1,
  },
  quantityInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    height: 44,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  quantityStepBtn: {
    width: 38,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  quantityTextInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    paddingVertical: 8,
  },
  formInputSimple: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    height: 44,
    fontSize: 13,
    color: '#0F172A',
  },

  /* KHỐI TỰ ĐỘNG THÀNH TIỀN */
  computedAmountBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
  },
  computedAmountLeft: {
    flex: 1,
  },
  computedAmountLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B91C1C',
    letterSpacing: 0.5,
  },
  computedAmountFormula: {
    fontSize: 11,
    color: '#7F1D1D',
    marginTop: 2,
  },
  computedAmountRight: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  computedAmountValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#DC2626',
    letterSpacing: -0.5,
  },
  computedAmountUnit: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
    marginLeft: 3,
  },

  advancedToggleBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  advancedToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  advancedSection: {
    paddingTop: 8,
  },
  methodToggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  methodToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  methodToggleBtnActive: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  methodToggleBtnPaidActive: {
    borderColor: '#059669',
    backgroundColor: '#ECFDF5',
  },
  methodToggleBtnUnpaidActive: {
    borderColor: '#B91C1C',
    backgroundColor: '#FEF2F2',
  },
  methodToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 6,
  },
  methodToggleTextActive: {
    color: '#DC2626',
    fontWeight: '700',
  },
  methodToggleTextPaidActive: {
    color: '#059669',
    fontWeight: '700',
  },
  methodToggleTextUnpaidActive: {
    color: '#B91C1C',
    fontWeight: '700',
  },
  modalActionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  submitCreateBtn: {
    flex: 2,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitCreateBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* SUGGESTION MODAL */
  suggestionModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  suggestionModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  suggestionSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 36,
    marginBottom: 10,
  },
  suggestionSearchInput: {
    flex: 1,
    fontSize: 12,
    color: '#0F172A',
  },
  suggestionItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  suggestionItemLeft: {
    flex: 1,
  },
  suggestionItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  suggestionItemSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  suggestionItemRight: {
    alignItems: 'flex-end',
  },
  suggestionItemPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
  },
  suggestionItemUnit: {
    fontSize: 10,
    color: '#64748B',
  },

  /* ACTION MODAL (CHI TIẾT & THAO TÁC DÒNG) */
  actionModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  actionModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  actionModalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  actionModalSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  actionDetailsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  actionDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  actionDetailHighlight: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: 4,
    paddingTop: 6,
  },
  actionDetailLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  actionDetailValue: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '500',
  },
  actionDetailValueBold: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '700',
  },
  actionDetailLabelHighlight: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B91C1C',
  },
  actionDetailValueHighlight: {
    fontSize: 14,
    fontWeight: '900',
    color: '#DC2626',
  },
  actionButtonsList: {
    marginTop: 4,
  },
  actionItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionItemBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
