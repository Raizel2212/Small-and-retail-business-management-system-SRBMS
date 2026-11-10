import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './client';
import { ApiResponse } from '../types/auth';
import { ExpenseSummary, ExpenseItem, CreateExpensePayload, UpdateExpensePayload, ProductSuggestion } from '../types/expense';
import { productCatalogService } from '../services/productCatalogService';

const EXPENSE_STORAGE_KEY = '@srbms_expense_summary_v2';
const PRODUCT_SUGGESTIONS_KEY = '@srbms_expense_suggestions_v2';

const formatVND = (num: number): string => {
  return Math.round(num)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

// Dữ liệu chi phí nhập hàng mẫu ban đầu (khi chưa có dữ liệu backend)
const INITIAL_EXPENSE_ITEMS: ExpenseItem[] = [
  {
    id: 1,
    stt: 1,
    transactionDate: '2026-10-20',
    transactionDateFormatted: '20/10/2026',
    supplierName: 'Đại lý phân phối cà phê Minh Hải',
    productName: 'Cà phê Robusta Đắk Lắk',
    unit: 'kg',
    quantity: 20,
    unitPrice: 180000,
    unitPriceFormatted: '180.000',
    amount: 3600000,
    amountFormatted: '3.600.000',
    paymentMethod: 'TIEN_MAT',
    paymentMethodLabel: 'Tiền mặt',
    paymentStatus: 'DA_THANH_TOAN',
    paymentStatusLabel: 'Đã chi tiền',
    isPaid: true,
    note: 'Nhập hạt nguyên chất vụ mới',
  },
  {
    id: 2,
    stt: 2,
    transactionDate: '2026-10-18',
    transactionDateFormatted: '18/10/2026',
    supplierName: 'Xưởng in bao bì Tân Phát',
    productName: 'Túi zip kraft đựng hàng',
    unit: 'cái',
    quantity: 500,
    unitPrice: 2500,
    unitPriceFormatted: '2.500',
    amount: 1250000,
    amountFormatted: '1.250.000',
    paymentMethod: 'CHUYEN_KHOAN',
    paymentMethodLabel: 'Chuyển khoản',
    paymentStatus: 'DA_THANH_TOAN',
    paymentStatusLabel: 'Đã chi tiền',
    isPaid: true,
    note: 'In logo thương hiệu',
  },
  {
    id: 3,
    stt: 3,
    transactionDate: '2026-10-16',
    transactionDateFormatted: '16/10/2026',
    supplierName: 'Công ty sữa đặc Phương Nam',
    productName: 'Sữa đặc có đường 380g',
    unit: 'lon',
    quantity: 30,
    unitPrice: 22000,
    unitPriceFormatted: '22.000',
    amount: 660000,
    amountFormatted: '660.000',
    paymentMethod: 'TIEN_MAT',
    paymentMethodLabel: 'Tiền mặt',
    paymentStatus: 'DA_THANH_TOAN',
    paymentStatusLabel: 'Đã chi tiền',
    isPaid: true,
    note: 'Thùng 30 lon',
  },
  {
    id: 4,
    stt: 4,
    transactionDate: '2026-10-12',
    transactionDateFormatted: '12/10/2026',
    supplierName: 'Đại lý nông sản Bảo Lộc',
    productName: 'Trà Ô long thượng hạng',
    unit: 'kg',
    quantity: 10,
    unitPrice: 250000,
    unitPriceFormatted: '250.000',
    amount: 2500000,
    amountFormatted: '2.500.000',
    paymentMethod: 'CHUYEN_KHOAN',
    paymentMethodLabel: 'Chuyển khoản',
    paymentStatus: 'CHUA_THANH_TOAN',
    paymentStatusLabel: 'Chưa thanh toán',
    isPaid: false,
    note: 'Công nợ gối đầu 15 ngày',
  },
];

// Hàm tính toán tổng hợp số liệu chi phí từ danh sách mặt hàng
const buildSummaryFromItems = (items: ExpenseItem[], period: 'month' | 'quarter' | 'year' | 'all' = 'month'): ExpenseSummary => {
  let totalExp = 0;
  let totalCash = 0;
  let totalTransfer = 0;
  let totalUnpaid = 0;
  let totalQty = 0;

  // Gán lại STT tăng dần 1..N
  const orderedItems = items.map((it, idx) => {
    const amt = it.amount || (it.quantity * it.unitPrice);
    totalExp += amt;
    totalQty += (it.quantity || 0);

    const isPaid = it.isPaid ?? (it.paymentStatus === 'DA_THANH_TOAN' || it.paymentStatus === 'DA_CHI');
    if (isPaid) {
      if (it.paymentMethod === 'CHUYEN_KHOAN') {
        totalTransfer += amt;
      } else {
        totalCash += amt;
      }
    } else {
      totalUnpaid += amt;
    }

    return {
      ...it,
      stt: idx + 1,
      amount: amt,
      amountFormatted: formatVND(amt),
      unitPriceFormatted: formatVND(it.unitPrice),
      isPaid,
      paymentStatusLabel: isPaid ? 'Đã chi tiền' : 'Chưa thanh toán',
      paymentMethodLabel: it.paymentMethod === 'CHUYEN_KHOAN' ? 'Chuyển khoản' : 'Tiền mặt',
    };
  });

  let periodLabel = 'Tháng 10/2026';
  if (period === 'quarter') periodLabel = 'Quý 4/2026';
  else if (period === 'year') periodLabel = 'Năm 2026';
  else if (period === 'all') periodLabel = 'Tất cả thời gian';

  return {
    totalExpense: totalExp,
    totalExpenseFormatted: formatVND(totalExp),
    totalCash: totalCash,
    totalCashFormatted: formatVND(totalCash),
    totalTransfer: totalTransfer,
    totalTransferFormatted: totalTransfer === 0 ? '-' : formatVND(totalTransfer),
    totalUnpaid: totalUnpaid,
    totalUnpaidFormatted: totalUnpaid === 0 ? '0' : formatVND(totalUnpaid),
    totalQuantity: totalQty,
    period,
    periodLabel,
    totalRecords: orderedItems.length,
    items: orderedItems,
  };
};

// Đọc danh sách chi phí từ local storage
const getLocalExpenseItems = async (): Promise<ExpenseItem[]> => {
  try {
    const raw = await AsyncStorage.getItem(EXPENSE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Lỗi đọc local expense storage:', e);
  }
  // Mặc định khởi tạo lần đầu với dữ liệu mẫu
  await AsyncStorage.setItem(EXPENSE_STORAGE_KEY, JSON.stringify(INITIAL_EXPENSE_ITEMS));
  return INITIAL_EXPENSE_ITEMS;
};

// Lưu danh sách chi phí vào local storage
const saveLocalExpenseItems = async (items: ExpenseItem[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(EXPENSE_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('Lỗi lưu local expense storage:', e);
  }
};

export const expenseApi = {
  /**
   * Lấy chi tiết chi phí nhập hàng và thống kê theo kỳ (Tháng, Quý, Năm, Tất cả)
   * Tự động đồng bộ với Backend API và lưu trữ bền vững vào AsyncStorage
   */
  async getExpenseSummary(
    period: 'month' | 'quarter' | 'year' | 'all' = 'month',
    year?: number,
    month?: number,
    quarter?: number
  ): Promise<ExpenseSummary> {
    try {
      const params: Record<string, any> = { period };
      if (year) params.year = year;
      if (month) params.month = month;
      if (quarter) params.quarter = quarter;

      const response = await apiClient.get<ApiResponse<ExpenseSummary>>('/api/v1/expenses', {
        params,
      });

      if (response.data && response.data.data && response.data.data.items && response.data.data.items.length > 0) {
        // Lưu cache lại vào AsyncStorage
        await saveLocalExpenseItems(response.data.data.items);
        return response.data.data;
      }
    } catch (error: any) {
      console.warn('Backend expenses offline hoặc lỗi mạng, sử dụng dữ liệu local:', error?.message);
    }

    // Fallback sang local storage bền vững
    const localItems = await getLocalExpenseItems();
    return buildSummaryFromItems(localItems, period);
  },

  /**
   * Thêm hàng mua vào danh sách chi phí
   * Lưu vào cả Backend API lẫn AsyncStorage để luôn hiển thị ngay lập tức
   */
  async createExpense(payload: CreateExpensePayload): Promise<ExpenseItem> {
    let createdItemFromBackend: ExpenseItem | null = null;

    try {
      const response = await apiClient.post<ApiResponse<ExpenseItem>>('/api/v1/expenses', payload);
      if (response.data && response.data.data) {
        createdItemFromBackend = response.data.data;
      }
    } catch (error: any) {
      console.warn('Backend createExpense offline, lưu vào local storage:', error?.message);
    }

    // Chuẩn bị item mới
    const now = new Date();
    const dateFormatted = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
    const dateIso = now.toISOString().split('T')[0];

    const currentItems = await getLocalExpenseItems();
    const qty = payload.quantity > 0 ? payload.quantity : 1;
    const unitPrice = payload.unitPrice >= 0 ? payload.unitPrice : 0;
    const computedAmt = payload.amount && payload.amount > 0 ? payload.amount : (qty * unitPrice);
    const isPaid = payload.paymentStatus === 'DA_THANH_TOAN' || (payload.paymentStatus as string) === 'DA_CHI';

    const newItem: ExpenseItem = createdItemFromBackend || {
      id: Date.now(),
      stt: currentItems.length + 1,
      transactionDate: payload.transactionDate || dateIso,
      transactionDateFormatted: dateFormatted,
      supplierName: payload.supplierName || 'Đại lý / Nhà phân phối',
      productName: payload.productName,
      unit: payload.unit || 'cái',
      quantity: qty,
      unitPrice: unitPrice,
      unitPriceFormatted: formatVND(unitPrice),
      amount: computedAmt,
      amountFormatted: formatVND(computedAmt),
      paymentMethod: payload.paymentMethod || 'TIEN_MAT',
      paymentMethodLabel: payload.paymentMethod === 'CHUYEN_KHOAN' ? 'Chuyển khoản' : 'Tiền mặt',
      paymentStatus: payload.paymentStatus || 'DA_THANH_TOAN',
      paymentStatusLabel: isPaid ? 'Đã chi tiền' : 'Chưa thanh toán',
      isPaid: isPaid,
      note: payload.note,
    };

    // Đưa item mới vào đầu danh sách
    const updatedItems = [newItem, ...currentItems];
    await saveLocalExpenseItems(updatedItems);

    // Tự động đồng bộ sản phẩm gợi ý sang phần Doanh thu
    await productCatalogService.notifyExpenseUpdated();

    return newItem;
  },

  /**
   * Cập nhật một khoản chi phí nhập hàng
   * Sau khi cập nhật, tự động đồng bộ lại danh mục sản phẩm và giá gợi ý sang Doanh thu
   */
  async updateExpense(id: number, payload: UpdateExpensePayload): Promise<ExpenseItem> {
    let updatedFromBackend: ExpenseItem | null = null;
    try {
      const response = await apiClient.put<ApiResponse<ExpenseItem>>(`/api/v1/expenses/${id}`, payload);
      if (response.data && response.data.data) {
        updatedFromBackend = response.data.data;
      }
    } catch (error: any) {
      console.warn('Backend updateExpense offline, lưu vào local storage:', error?.message);
    }

    const currentItems = await getLocalExpenseItems();
    const updatedItems = currentItems.map((item) => {
      if (item.id === id) {
        if (updatedFromBackend) return updatedFromBackend;

        const qty = payload.quantity !== undefined && payload.quantity > 0 ? payload.quantity : item.quantity;
        const unitPrice = payload.unitPrice !== undefined ? payload.unitPrice : item.unitPrice;
        const amt = payload.amount !== undefined && payload.amount > 0 ? payload.amount : (qty * unitPrice);
        const isPaid = payload.paymentStatus
          ? (payload.paymentStatus === 'DA_THANH_TOAN' || (payload.paymentStatus as string) === 'DA_CHI')
          : item.isPaid;

        return {
          ...item,
          productName: payload.productName ? payload.productName.trim() : item.productName,
          supplierName: payload.supplierName ? payload.supplierName.trim() : item.supplierName,
          unit: payload.unit ? payload.unit.trim() : item.unit,
          quantity: qty,
          unitPrice: unitPrice,
          unitPriceFormatted: formatVND(unitPrice),
          amount: amt,
          amountFormatted: formatVND(amt),
          suggestedSellingPrice: payload.suggestedSellingPrice !== undefined ? payload.suggestedSellingPrice : item.suggestedSellingPrice,
          suggestedSellingPriceFormatted: payload.suggestedSellingPrice ? formatVND(payload.suggestedSellingPrice) : item.suggestedSellingPriceFormatted,
          transactionDate: payload.transactionDate || item.transactionDate,
          paymentMethod: payload.paymentMethod || item.paymentMethod,
          paymentMethodLabel: (payload.paymentMethod || item.paymentMethod) === 'CHUYEN_KHOAN' ? 'Chuyển khoản' : 'Tiền mặt',
          paymentStatus: payload.paymentStatus || item.paymentStatus,
          paymentStatusLabel: isPaid ? 'Đã chi tiền' : 'Chưa thanh toán',
          isPaid: isPaid,
          note: payload.note !== undefined ? payload.note : item.note,
        };
      }
      return item;
    });

    await saveLocalExpenseItems(updatedItems);

    // Tự động đồng bộ sản phẩm gợi ý sang phần Doanh thu
    await productCatalogService.notifyExpenseUpdated();

    const target = updatedItems.find((it) => it.id === id);
    if (!target) throw new Error('Không tìm thấy khoản chi phí để cập nhật');
    return target;
  },

  /**
   * Chuyển đổi trạng thái thanh toán Đã thanh toán <-> Chưa thanh toán
   */
  async togglePaymentStatus(id: number): Promise<ExpenseItem> {
    try {
      const response = await apiClient.patch<ApiResponse<ExpenseItem>>(
        `/api/v1/expenses/${id}/toggle-status`
      );
      if (response.data && response.data.data) {
        const itemData = response.data.data;
        // Cập nhật lại trong local
        const currentItems = await getLocalExpenseItems();
        const updated = currentItems.map((it) => (it.id === id ? itemData : it));
        await saveLocalExpenseItems(updated);
        await productCatalogService.notifyExpenseUpdated();
        return itemData;
      }
    } catch (error: any) {
      console.warn('Backend togglePaymentStatus offline, cập nhật local:', error?.message);
    }

    const currentItems = await getLocalExpenseItems();
    const target = currentItems.find((it) => it.id === id);
    if (target) {
      const nextPaid = !target.isPaid;
      target.isPaid = nextPaid;
      target.paymentStatus = nextPaid ? 'DA_THANH_TOAN' : 'CHUA_THANH_TOAN';
      target.paymentStatusLabel = nextPaid ? 'Đã chi tiền' : 'Chưa thanh toán';
      await saveLocalExpenseItems(currentItems);
      await productCatalogService.notifyExpenseUpdated();
      return target;
    }
    throw new Error('Không tìm thấy khoản chi phí');
  },

  /**
   * Xóa một khoản chi phí nhập hàng
   */
  async deleteExpense(id: number): Promise<void> {
    try {
      await apiClient.delete<ApiResponse<void>>(`/api/v1/expenses/${id}`);
    } catch (error: any) {
      console.warn('Backend deleteExpense offline, xóa local:', error?.message);
    }

    const currentItems = await getLocalExpenseItems();
    const filtered = currentItems.filter((it) => it.id !== id);
    await saveLocalExpenseItems(filtered);

    // Tự động đồng bộ lại sản phẩm sang phần Doanh thu sau khi xóa chi phí
    await productCatalogService.notifyExpenseUpdated();
  },

  /**
   * Lấy danh mục sản phẩm và giá gợi ý từ các đợt nhập hàng
   */
  async getProductSuggestions(keyword?: string): Promise<ProductSuggestion[]> {
    try {
      const response = await apiClient.get<ApiResponse<ProductSuggestion[]>>(
        '/api/v1/expenses/product-suggestions',
        {
          params: keyword ? { keyword } : undefined,
        }
      );
      if (response.data?.data && response.data.data.length > 0) {
        return response.data.data;
      }
    } catch (error) {
      // Fallback
    }

    // Gợi ý từ các mặt hàng đã nhập trong local storage
    const currentItems = await getLocalExpenseItems();
    const map = new Map<string, ProductSuggestion>();
    currentItems.forEach((it) => {
      const key = it.productName.trim().toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          id: it.id,
          productName: it.productName,
          unit: it.unit,
          latestCostPrice: it.unitPrice,
          latestCostPriceFormatted: it.unitPriceFormatted,
          lastSupplier: it.supplierName,
        });
      }
    });

    const list = Array.from(map.values());
    if (keyword) {
      return list.filter((p) => p.productName.toLowerCase().includes(keyword.toLowerCase()));
    }
    return list;
  },
};
