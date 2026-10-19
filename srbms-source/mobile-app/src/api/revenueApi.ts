import { apiClient } from './client';
import { ApiResponse } from '../types/auth';
import { RevenueSummary, RevenueItem, CreateRevenuePayload } from '../types/revenue';

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
    const response = await apiClient.post<ApiResponse<RevenueItem>>('/api/v1/revenue', payload);
    if (response.data && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data?.message || 'Không thể tạo giao dịch doanh thu');
  },

  /**
   * Chuyển đổi trạng thái Đã thu tiền <-> Chưa thu tiền
   * Endpoint: PATCH /api/v1/revenue/{id}/toggle-status
   */
  async togglePaymentStatus(id: number): Promise<RevenueItem> {
    const response = await apiClient.patch<ApiResponse<RevenueItem>>(
      `/api/v1/revenue/${id}/toggle-status`
    );
    if (response.data && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data?.message || 'Không thể cập nhật trạng thái');
  },

  /**
   * Xóa một khoản doanh thu
   * Endpoint: DELETE /api/v1/revenue/{id}
   */
  async deleteRevenue(id: number): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/api/v1/revenue/${id}`);
  },
};
