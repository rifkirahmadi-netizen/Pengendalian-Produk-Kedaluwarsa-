export type StockStatus = 'KADALUWARSA' | 'KRITIS' | 'PERINGATAN_DINI' | 'AMAN';

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  minStockAlert: number;
  sellingPriceRef: number;
  image?: string;
}

export interface BatchItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  category: string;
  unit: string;
  batchNumber: string;
  productionDate: string; // YYYY-MM-DD
  expiryDate: string;     // YYYY-MM-DD
  entryDate: string;      // YYYY-MM-DD
  initialStock: number;
  currentStock: number;
  costPrice: number;      // Harga Modal/Beli per unit (IDR)
  sellingPrice: number;   // Harga Jual per unit (IDR)
  locationRack: string;   // Rak A-01, Chiller 1, dsb
  supplierName: string;
  supplierPhone: string;
  notes?: string;
  lastNotifiedAt?: string;
  lastNotifiedType?: string;
}

export interface WhatsAppLogItem {
  id: string;
  timestamp: string;
  batchId: string;
  batchNumber: string;
  productName: string;
  recipientPhone: string;
  recipientName: string;
  recipientRole: 'owner' | 'gudang' | 'kasir' | 'supplier';
  alertType: 'H-30' | 'H-14' | 'H-7' | 'H-3' | 'H-0' | 'RETUR' | 'MANUAL';
  messageText: string;
  status: 'Terkirim' | 'Gagal' | 'Siap Dikirim';
  provider: 'wa_direct' | 'fonnte' | 'wablas' | 'custom_webhook';
}

export interface StockMovement {
  id: string;
  timestamp: string;
  batchId: string;
  batchNumber: string;
  productId: string;
  productName: string;
  type: 'IN' | 'OUT_SALE' | 'OUT_EXPIRED' | 'OUT_RETURN' | 'ADJUSTMENT';
  quantity: number;
  reason: string;
  actor: string;
  isFefoCompliant: boolean;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  alertType: 'H-30' | 'H-14' | 'H-7' | 'H-3' | 'H-0' | 'RETUR';
  templateText: string;
}

export interface AppSettings {
  umkmName: string;
  umkmAddress: string;
  ownerName: string;
  ownerPhone: string;
  warehouseName: string;
  warehousePhone: string;
  cashierName: string;
  cashierPhone: string;
  autoNotifyDays: number[]; // e.g. [30, 14, 7, 3, 0]
  autoNotifyEnabled: boolean;
  whatsappProvider: 'wa_direct' | 'fonnte' | 'wablas' | 'custom_webhook';
  apiKey: string;
  customWebhookUrl: string;
  strictFefoEnforcement: boolean;
  simulatedCurrentDate: string; // YYYY-MM-DD
}

export interface FEFODispatchAllocation {
  batch: BatchItem;
  allocatedQty: number;
  daysRemaining: number;
  status: StockStatus;
}
