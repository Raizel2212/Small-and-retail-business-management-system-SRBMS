import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './client';
import { ApiResponse } from '../types/auth';
import { RevenueSummary, RevenueItem, CreateRevenuePayload, ProductCatalogItem } from '../types/revenue';

export const DEFAULT_PRODUCTS: ProductCatalogItem[] = [
  { id: 'SP01', name: 'Cà phê đen', price: 25000, unit: 'ly' },
  { id: 'SP02', name: 'Cà phê sữa đá', price: 28000, unit: 'ly' },
  { id: 'SP03', name: 'Nước ngọt lon (Coca/Pepsi)', price: 15000, unit: 'lon' },
  { id: 'SP04', name: 'Nước suối tinh khiết', price: 10000, unit: 'chai' },
  { id: 'SP05', name: 'Bánh mì thịt đặc biệt', price: 30000, unit: 'ổ' },
  { id: 'SP06', name: 'Khăn lạnh tiệt trùng', price: 5000, unit: 'cái' },
  { id: 'SP07', name: 'Áo thun cotton cao cấp', price: 120000, unit: 'cái' },
  { id: 'SP08', name: 'Gạo ST25 Ông Cua (5kg)', price: 180000, unit: 'túi' },
  { id: 'SP09', name: 'Bột ngũ cốc dinh dưỡng', price: 200000, unit: 'hộp' },
  { id: 'SP10', name: 'Trà Thái Nguyên Thượng Hạng', price: 300000, unit: 'gói' },
];

const PRODUCT_STORAGE_KEY = '@srbms_product_catalog';

export const productCatalogService = {
  async getCatalog(): Promise<ProductCatalogItem[]> {
    try {
      const stored = await AsyncStorage.getItem(PRODUCT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error loading product catalog:', e);
    }
    return DEFAULT_PRODUCTS;
  },

  async addOrUpdateProduct(product: ProductCatalogItem): Promise<ProductCatalogItem[]> {
    try {
      const list = await productCatalogService.getCatalog();
      const existingIdx = list.findIndex(
        (p) =>
          p.name.trim().toLowerCase() === product.name.trim().toLowerCase() ||
          p.id.toLowerCase() === product.id.toLowerCase()
      );
      let updated: ProductCatalogItem[];
      if (existingIdx >= 0) {
        updated = [...list];
        updated[existingIdx] = { ...updated[existingIdx], ...product };
      } else {
        updated = [product, ...list];
      }
      await AsyncStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.warn('Error saving product:', e);
      return DEFAULT_PRODUCTS;
    }
  },
};

const formatVND = (num: number): string => {
  return Math.round(num)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

// Dữ liệu mẫu dự phòng trường hợp Backend tạm thời mất kết nối
const FALLBACK_SUMMARY: RevenueSummary = {
  totalRevenue: 30000000,
  totalRevenueFormatted: '30.000.000',
  totalCash: 1000000,
  totalCashFormatted: '1.000.000',
  totalTransfer: 27000000,
  totalTransferFormatted: '-',
  totalUnpaid: 2000000,
  totalUnpaidFormatted: '2.000.000',
  period: 'month',
  periodLabel: 'Tháng 10/2026',
  totalRecords: 4,
  items: [
    {
      id: 1,
      stt: 1,
      transactionDate: '2026-10-16',
      transactionDateFormatted: '16/10/2026',
      customerName: 'Nguyễn văn A',
      productName: 'Cà phê Robusta Đắk Lắk',
      quantity: 4,
      unitPrice: 250000,
      unitPriceFormatted: '250.000',
      isRetailCustomer: false,
      amount: 1000000,
      amountFormatted: '1.000.000',
      paymentMethod: 'TIEN_MAT',
      paymentMethodLabel: 'Tiền mặt',
      paymentStatus: 'DA_THU',
      paymentStatusLabel: 'Đã thu tiền',
      isPaid: true,
      note: 'Thanh toán tiền mặt tại quầy',
    },
    {
      id: 2,
      stt: 2,
      transactionDate: '2026-10-16',
      transactionDateFormatted: '16/10/2026',
      customerName: 'Phan tú Q',
      productName: 'Bột ngũ cốc dinh dưỡng',
      quantity: 10,
      unitPrice: 200000,
      unitPriceFormatted: '200.000',
      isRetailCustomer: false,
      amount: 2000000,
      amountFormatted: '2.000.000',
      paymentMethod: 'TIEN_MAT',
      paymentMethodLabel: 'Tiền mặt',
      paymentStatus: 'CHUA_THU',
      paymentStatusLabel: 'Chưa thu tiền',
      isPaid: false,
      note: 'Giao hàng chưa thu tiền',
    },
    {
      id: 3,
      stt: 3,
      transactionDate: '2026-10-15',
      transactionDateFormatted: '15/10/2026',
      customerName: 'Trần Mai L',
      productName: 'Bộ ấm chén Bát Tràng',
      quantity: 30,
      unitPrice: 500000,
      unitPriceFormatted: '500.000',
      isRetailCustomer: false,
      amount: 15000000,
      amountFormatted: '15.000.000',
      paymentMethod: 'CHUYEN_KHOAN',
      paymentMethodLabel: 'Chuyển khoản',
      paymentStatus: 'DA_THU',
      paymentStatusLabel: 'Đã thu tiền',
      isPaid: true,
      note: 'Chuyển khoản Vietcombank',
    },
    {
      id: 4,
      stt: 4,
      transactionDate: '2026-10-14',
      transactionDateFormatted: '14/10/2026',
      customerName: 'Vũ Đình K',
      productName: 'Trà Thái Nguyên Thượng Hạng',
      quantity: 40,
      unitPrice: 300000,
      unitPriceFormatted: '300.000',
      isRetailCustomer: false,
      amount: 12000000,
      amountFormatted: '12.000.000',
      paymentMethod: 'CHUYEN_KHOAN',
      paymentMethodLabel: 'Chuyển khoản',
      paymentStatus: 'DA_THU',
      paymentStatusLabel: 'Đã thu tiền',
      isPaid: true,
      note: 'Chuyển khoản đơn buôn sỉ',
    },
  ],
};

const recalculateFallbackTotals = () => {
  let rev = 0;
  let cash = 0;
  let transfer = 0;
  let unpaid = 0;

  FALLBACK_SUMMARY.items.forEach((it, idx) => {
    it.stt = idx + 1;
    rev += it.amount;
    const paid = it.isPaid ?? it.paymentStatus === 'DA_THU';
    if (paid) {
      if (it.paymentMethod === 'CHUYEN_KHOAN') {
        transfer += it.amount;
      } else {
        cash += it.amount;
      }
    } else {
      unpaid += it.amount;
    }
  });

  FALLBACK_SUMMARY.totalRevenue = rev;
  FALLBACK_SUMMARY.totalRevenueFormatted = formatVND(rev);
  FALLBACK_SUMMARY.totalCash = cash;
  FALLBACK_SUMMARY.totalCashFormatted = formatVND(cash);
  FALLBACK_SUMMARY.totalTransfer = transfer;
  FALLBACK_SUMMARY.totalTransferFormatted = transfer === 0 ? '-' : formatVND(transfer);
  FALLBACK_SUMMARY.totalUnpaid = unpaid;
  FALLBACK_SUMMARY.totalUnpaidFormatted = unpaid === 0 ? '0' : formatVND(unpaid);
  FALLBACK_SUMMARY.totalRecords = FALLBACK_SUMMARY.items.length;
};

export const revenueApi = {
  /**
   * Lấy chi tiết doanh thu và thống kê theo kỳ (Tháng, Quý, Năm, Tất cả)
   * Endpoint: GET /api/v1/revenue?period=...&year=...&month=...&quarter=...
   */
  async getRevenueSummary(
    period: 'month' | 'quarter' | 'year' | 'all' = 'month',
    year?: number,
    month?: number,
    quarter?: number
  ): Promise<RevenueSummary> {
    try {
      const params: Record<string, any> = { period };
      if (year) params.year = year;
      if (month) params.month = month;
      if (quarter) params.quarter = quarter;

      const response = await apiClient.get<ApiResponse<RevenueSummary>>('/api/v1/revenue', {
        params,
      });

      if (response.data && response.data.data) {
        return response.data.data;
      }
      return FALLBACK_SUMMARY;
    } catch (error: any) {
      console.warn('API getRevenueSummary fallback do kết nối:', error.message);
      return FALLBACK_SUMMARY;
    }
  },

  /**
   * Tạo giao dịch / khoản thu mới (+ Tạo mới)
   * Endpoint: POST /api/v1/revenue
   */
  async createRevenue(payload: CreateRevenuePayload): Promise<RevenueItem> {
    try {
      const response = await apiClient.post<ApiResponse<RevenueItem>>('/api/v1/revenue', payload);
      if (response.data && response.data.data) {
        return response.data.data;
      }
    } catch (error: any) {
      console.warn('Backend offline, lưu tạm vào Fallback local:', error.message);
    }

    // Fallback: Tự động lưu vào local state để người dùng luôn thấy ngay kết quả
    const now = new Date();
    const dateFormatted = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
    const dateIso = now.toISOString().split('T')[0];
    const isPaid = payload.paymentStatus === 'DA_THU';

    const newItem: RevenueItem = {
      id: Date.now(),
      stt: FALLBACK_SUMMARY.items.length + 1,
      transactionDate: payload.transactionDate || dateIso,
      transactionDateFormatted: dateFormatted,
      customerName: payload.customerName,
      productName: payload.productName,
      quantity: payload.quantity || 1,
      unitPrice: payload.unitPrice,
      unitPriceFormatted: payload.unitPrice ? formatVND(payload.unitPrice) : undefined,
      isRetailCustomer: payload.isRetailCustomer,
      amount: payload.amount,
      amountFormatted: formatVND(payload.amount),
      paymentMethod: payload.paymentMethod,
      paymentMethodLabel: payload.paymentMethod === 'CHUYEN_KHOAN' ? 'Chuyển khoản' : 'Tiền mặt',
      paymentStatus: payload.paymentStatus,
      paymentStatusLabel: isPaid ? 'Đã thu tiền' : 'Chưa thu tiền',
      isPaid: isPaid,
      note: payload.note,
    };

    FALLBACK_SUMMARY.items.unshift(newItem);
    recalculateFallbackTotals();

    return newItem;
  },

  /**
   * Chuyển đổi trạng thái Đã thu tiền <-> Chưa thu tiền
   * Endpoint: PATCH /api/v1/revenue/{id}/toggle-status
   */
  async togglePaymentStatus(id: number): Promise<RevenueItem> {
    try {
      const response = await apiClient.patch<ApiResponse<RevenueItem>>(
        `/api/v1/revenue/${id}/toggle-status`
      );
      if (response.data && response.data.data) {
        return response.data.data;
      }
    } catch (error: any) {
      console.warn('Backend offline, toggle Fallback local:', error.message);
    }

    const item = FALLBACK_SUMMARY.items.find((it) => it.id === id);
    if (item) {
      const nextPaid = !(item.isPaid ?? item.paymentStatus === 'DA_THU');
      item.isPaid = nextPaid;
      item.paymentStatus = nextPaid ? 'DA_THU' : 'CHUA_THU';
      item.paymentStatusLabel = nextPaid ? 'Đã thu tiền' : 'Chưa thu tiền';
      recalculateFallbackTotals();
      return item;
    }
    throw new Error('Không tìm thấy khoản doanh thu');
  },

  /**
   * Xóa một khoản doanh thu
   * Endpoint: DELETE /api/v1/revenue/{id}
   */
  async deleteRevenue(id: number): Promise<void> {
    try {
      await apiClient.delete<ApiResponse<void>>(`/api/v1/revenue/${id}`);
    } catch (error: any) {
      console.warn('Backend offline, xóa Fallback local:', error.message);
    }

    const idx = FALLBACK_SUMMARY.items.findIndex((it) => it.id === id);
    if (idx >= 0) {
      FALLBACK_SUMMARY.items.splice(idx, 1);
      recalculateFallbackTotals();
    }
  },
};

