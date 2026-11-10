import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../api/client';
import { ApiResponse } from '../types/auth';
import { ProductCatalogItem } from '../types/revenue';
import { ExpenseItem } from '../types/expense';

export const PRODUCT_STORAGE_KEY = '@srbms_product_catalog_v2';
export const EXPENSE_STORAGE_KEY = '@srbms_expense_summary_v2';

const formatVND = (num: number): string => {
  return Math.round(num)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

// Danh mục sản phẩm mẫu khởi tạo từ các mặt hàng nhập của Chi phí
export const DEFAULT_PRODUCTS: ProductCatalogItem[] = [
  {
    id: 'SP01',
    name: 'Cà phê Robusta Đắk Lắk',
    unit: 'kg',
    costPrice: 180000,
    costPriceFormatted: '180.000',
    price: 250000,
    suggestedSellingPrice: 250000,
    suggestedSellingPriceFormatted: '250.000',
    totalImportedQuantity: 20,
    lastSupplier: 'Đại lý phân phối cà phê Minh Hải',
    isFromExpense: true,
  },
  {
    id: 'SP02',
    name: 'Túi zip kraft đựng hàng',
    unit: 'cái',
    costPrice: 2500,
    costPriceFormatted: '2.500',
    price: 4000,
    suggestedSellingPrice: 4000,
    suggestedSellingPriceFormatted: '4.000',
    totalImportedQuantity: 500,
    lastSupplier: 'Xưởng in bao bì Tân Phát',
    isFromExpense: true,
  },
  {
    id: 'SP03',
    name: 'Sữa đặc có đường 380g',
    unit: 'lon',
    costPrice: 22000,
    costPriceFormatted: '22.000',
    price: 28000,
    suggestedSellingPrice: 28000,
    suggestedSellingPriceFormatted: '28.000',
    totalImportedQuantity: 30,
    lastSupplier: 'Công ty sữa đặc Phương Nam',
    isFromExpense: true,
  },
  {
    id: 'SP04',
    name: 'Trà Ô long thượng hạng',
    unit: 'kg',
    costPrice: 250000,
    costPriceFormatted: '250.000',
    price: 350000,
    suggestedSellingPrice: 350000,
    suggestedSellingPriceFormatted: '350.000',
    totalImportedQuantity: 10,
    lastSupplier: 'Đại lý nông sản Bảo Lộc',
    isFromExpense: true,
  },
  {
    id: 'SP05',
    name: 'Bột ngũ cốc dinh dưỡng',
    unit: 'hộp',
    costPrice: 140000,
    costPriceFormatted: '140.000',
    price: 200000,
    suggestedSellingPrice: 200000,
    suggestedSellingPriceFormatted: '200.000',
    totalImportedQuantity: 30,
    lastSupplier: 'Công ty TNHH Thực phẩm Xanh Sài Gòn',
    isFromExpense: true,
  },
  {
    id: 'SP06',
    name: 'Bộ ấm chén Bát Tràng',
    unit: 'bộ',
    costPrice: 350000,
    costPriceFormatted: '350.000',
    price: 500000,
    suggestedSellingPrice: 500000,
    suggestedSellingPriceFormatted: '500.000',
    totalImportedQuantity: 50,
    lastSupplier: 'Xưởng gốm sứ thủ công Bát Tràng',
    isFromExpense: true,
  },
  {
    id: 'SP07',
    name: 'Trà Thái Nguyên Thượng Hạng',
    unit: 'gói',
    costPrice: 200000,
    costPriceFormatted: '200.000',
    price: 300000,
    suggestedSellingPrice: 300000,
    suggestedSellingPriceFormatted: '300.000',
    totalImportedQuantity: 60,
    lastSupplier: 'Hợp tác xã Trà Tân Cương Thái Nguyên',
    isFromExpense: true,
  },
];

type CatalogListener = (catalog: ProductCatalogItem[]) => void;

class ProductCatalogManager {
  private listeners: Set<CatalogListener> = new Set();
  private cachedCatalog: ProductCatalogItem[] | null = null;

  /**
   * Đăng ký lắng nghe sự kiện khi danh mục sản phẩm từ Chi phí thay đổi
   */
  subscribe(listener: CatalogListener): () => void {
    this.listeners.add(listener);
    // Nếu đã có cache thì gọi ngay cho listener mới
    if (this.cachedCatalog && this.cachedCatalog.length > 0) {
      try {
        listener(this.cachedCatalog);
      } catch (err) {
        console.warn('Lỗi listener catalog:', err);
      }
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(catalog: ProductCatalogItem[]) {
    this.cachedCatalog = catalog;
    this.listeners.forEach((fn) => {
      try {
        fn(catalog);
      } catch (err) {
        console.warn('Lỗi gọi listener catalog:', err);
      }
    });
  }

  /**
   * Tự động lấy danh mục sản phẩm và giá gợi ý từ Chi phí
   * Ưu tiên Backend API, nếu offline thì tự động trích xuất từ dữ liệu Chi phí local
   */
  async syncFromExpenses(forceBackend = false): Promise<ProductCatalogItem[]> {
    // 1. Thử gọi Backend API /api/v1/revenue/product-suggestions
    try {
      const response = await apiClient.get<ApiResponse<any[]>>('/api/v1/revenue/product-suggestions');
      if (response.data && response.data.data && response.data.data.length > 0) {
        const backendItems: ProductCatalogItem[] = response.data.data.map((item: any, idx: number) => {
          const cost = item.latestCostPrice != null ? Number(item.latestCostPrice) : undefined;
          const suggested = item.suggestedSellingPrice != null
            ? Number(item.suggestedSellingPrice)
            : (cost ? Math.round((cost * 1.25) / 1000) * 1000 : 0);

          return {
            id: item.productCode || `SP${(idx + 1).toString().padStart(2, '0')}`,
            name: item.productName,
            price: suggested || cost || 0,
            unit: item.unit || 'cái',
            costPrice: cost,
            costPriceFormatted: item.latestCostPriceFormatted || (cost ? formatVND(cost) : undefined),
            suggestedSellingPrice: suggested,
            suggestedSellingPriceFormatted: item.suggestedSellingPriceFormatted || (suggested ? formatVND(suggested) : undefined),
            totalImportedQuantity: item.totalImportedQuantity || 0,
            lastImportDate: item.lastImportDate,
            lastImportDateFormatted: item.lastImportDateFormatted,
            lastSupplier: item.lastSupplier,
            category: item.category || 'HANG_HOA',
            isFromExpense: true,
          };
        });

        await AsyncStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(backendItems));
        this.notify(backendItems);
        return backendItems;
      }
    } catch (e: any) {
      console.warn('Backend product suggestions fallback sang local expense storage:', e?.message);
    }

    // 2. Fallback: Trích xuất trực tiếp từ danh sách chi phí đã nhập trong AsyncStorage
    try {
      const rawExpenses = await AsyncStorage.getItem(EXPENSE_STORAGE_KEY);
      if (rawExpenses) {
        const expenseItems: ExpenseItem[] = JSON.parse(rawExpenses);
        if (Array.isArray(expenseItems) && expenseItems.length > 0) {
          const extracted = this.extractProductsFromExpenses(expenseItems);
          if (extracted.length > 0) {
            await AsyncStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(extracted));
            this.notify(extracted);
            return extracted;
          }
        }
      }
    } catch (e) {
      console.warn('Lỗi đọc local expense storage:', e);
    }

    // 3. Đọc từ PRODUCT_STORAGE_KEY đã lưu trước đó nếu có
    try {
      const stored = await AsyncStorage.getItem(PRODUCT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.notify(parsed);
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Lỗi đọc stored product catalog:', e);
    }

    // 4. Mặc định dùng danh mục mẫu từ chi phí ban đầu
    await AsyncStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(DEFAULT_PRODUCTS));
    this.notify(DEFAULT_PRODUCTS);
    return DEFAULT_PRODUCTS;
  }

  /**
   * Nhóm các khoản chi phí theo tên sản phẩm để tính toán giá vốn và giá gợi ý
   */
  private extractProductsFromExpenses(expenseItems: ExpenseItem[]): ProductCatalogItem[] {
    const map = new Map<string, {
      name: string;
      unit: string;
      latestCost: number;
      suggestedPrice?: number;
      totalQty: number;
      supplier: string;
      date: string;
      category?: string;
    }>();

    // Duyệt qua tất cả giao dịch chi phí
    expenseItems.forEach((tx) => {
      if (!tx.productName || !tx.productName.trim()) return;
      const key = tx.productName.trim().toLowerCase();
      const existing = map.get(key);

      const qty = tx.quantity || 0;
      const cost = tx.unitPrice || 0;
      const suggested = tx.suggestedSellingPrice || (cost ? Math.round((cost * 1.25) / 1000) * 1000 : cost);

      if (!existing) {
        map.set(key, {
          name: tx.productName.trim(),
          unit: tx.unit || 'cái',
          latestCost: cost,
          suggestedPrice: suggested,
          totalQty: qty,
          supplier: tx.supplierName || 'Đại lý phân phối',
          date: tx.transactionDateFormatted || tx.transactionDate || '',
          category: tx.category,
        });
      } else {
        existing.totalQty += qty;
        // tx xuất hiện trước là giao dịch mới hơn
        if (cost > 0 && !existing.latestCost) {
          existing.latestCost = cost;
        }
        if (suggested > 0 && !existing.suggestedPrice) {
          existing.suggestedPrice = suggested;
        }
      }
    });

    let index = 1;
    const result: ProductCatalogItem[] = [];
    map.forEach((item) => {
      const finalPrice = item.suggestedPrice || item.latestCost || 0;
      result.push({
        id: `SP${index.toString().padStart(2, '0')}`,
        name: item.name,
        price: finalPrice,
        unit: item.unit,
        costPrice: item.latestCost,
        costPriceFormatted: item.latestCost ? formatVND(item.latestCost) : undefined,
        suggestedSellingPrice: item.suggestedPrice,
        suggestedSellingPriceFormatted: item.suggestedPrice ? formatVND(item.suggestedPrice) : undefined,
        totalImportedQuantity: item.totalQty,
        lastSupplier: item.supplier,
        lastImportDate: item.date,
        lastImportDateFormatted: item.date,
        category: item.category || 'HANG_HOA',
        isFromExpense: true,
      });
      index++;
    });

    return result;
  }

  /**
   * Lấy danh mục sản phẩm hiện có
   */
  async getCatalog(): Promise<ProductCatalogItem[]> {
    if (this.cachedCatalog && this.cachedCatalog.length > 0) {
      return this.cachedCatalog;
    }
    return this.syncFromExpenses();
  }

  /**
   * Kích hoạt cập nhật khi phần Chi phí vừa tạo/sửa/xóa một khoản chi
   */
  async notifyExpenseUpdated(): Promise<ProductCatalogItem[]> {
    console.log('[ProductCatalogManager] Chi phí vừa cập nhật, tự động đồng bộ sang Doanh thu...');
    return this.syncFromExpenses(true);
  }

  /**
   * Thêm hoặc cập nhật một mặt hàng vào danh mục (nếu user tạo hàng mới từ Doanh thu)
   */
  async addOrUpdateProduct(product: ProductCatalogItem): Promise<ProductCatalogItem[]> {
    try {
      const list = await this.getCatalog();
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
      this.notify(updated);
      return updated;
    } catch (e) {
      console.warn('Lỗi lưu product catalog:', e);
      return DEFAULT_PRODUCTS;
    }
  }
}

export const productCatalogService = new ProductCatalogManager();

