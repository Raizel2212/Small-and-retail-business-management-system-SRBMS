export interface ExpenseItem {
  id: number;
  stt?: number;
  transactionDate: string;
  transactionDateFormatted: string;
  supplierName: string;
  productName: string;
  category?: string;
  categoryLabel?: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  unitPriceFormatted: string;
  amount: number;
  amountFormatted: string;
  suggestedSellingPrice?: number;
  suggestedSellingPriceFormatted?: string;
  paymentMethod: 'TIEN_MAT' | 'CHUYEN_KHOAN' | string;
  paymentMethodLabel: string;
  paymentStatus: 'DA_THANH_TOAN' | 'CHUA_THANH_TOAN' | string;
  paymentStatusLabel: string;
  isPaid: boolean;
  note?: string;
}

export interface ExpenseSummary {
  totalExpense: number;
  totalExpenseFormatted: string;
  totalCash: number;
  totalCashFormatted: string;
  totalTransfer: number;
  totalTransferFormatted: string;
  totalUnpaid: number;
  totalUnpaidFormatted: string;
  totalQuantity: number;
  period: 'month' | 'quarter' | 'year' | 'all';
  periodLabel: string;
  totalRecords: number;
  items: ExpenseItem[];
}

export interface CreateExpensePayload {
  supplierName: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  amount?: number;
  suggestedSellingPrice?: number;
  unit?: string;
  category?: string;
  transactionDate?: string;
  paymentMethod?: 'TIEN_MAT' | 'CHUYEN_KHOAN';
  paymentStatus?: 'DA_THANH_TOAN' | 'CHUA_THANH_TOAN';
  note?: string;
}

export interface ProductSuggestion {
  id: number;
  productCode?: string;
  productName: string;
  unit?: string;
  category?: string;
  latestCostPrice?: number;
  latestCostPriceFormatted?: string;
  suggestedSellingPrice?: number;
  suggestedSellingPriceFormatted?: string;
  totalImportedQuantity?: number;
  lastImportDate?: string;
  lastImportDateFormatted?: string;
  lastSupplier?: string;
}
