export interface RevenueItem {
  id: number;
  stt?: number;
  transactionDate: string;
  transactionDateFormatted: string;
  customerName: string;
  amount: number;
  amountFormatted: string;
  productName?: string;
  quantity?: number;
  unitPrice?: number;
  unitPriceFormatted?: string;
  isRetailCustomer?: boolean;
  paymentMethod: 'TIEN_MAT' | 'CHUYEN_KHOAN' | string;
  paymentMethodLabel: string;
  paymentStatus: 'DA_THU' | 'CHUA_THU' | string;
  paymentStatusLabel: string;
  isPaid: boolean;
  note?: string;
}

export interface RevenueSummary {
  totalRevenue: number;
  totalRevenueFormatted: string;
  totalCash: number;
  totalCashFormatted: string;
  totalTransfer: number;
  totalTransferFormatted: string;
  totalUnpaid: number;
  totalUnpaidFormatted: string;
  period: 'month' | 'quarter' | 'year' | 'all';
  periodLabel: string;
  totalRecords: number;
  items: RevenueItem[];
}

export interface CreateRevenuePayload {
  customerName: string;
  amount: number;
  transactionDate?: string;
  productName?: string;
  quantity?: number;
  unitPrice?: number;
  isRetailCustomer?: boolean;
  paymentMethod: 'TIEN_MAT' | 'CHUYEN_KHOAN';
  paymentStatus: 'DA_THU' | 'CHUA_THU';
  note?: string;
}

export interface ProductCatalogItem {
  id: string;
  name: string;
  price: number;
  unit?: string;
}
