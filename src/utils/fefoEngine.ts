import { BatchItem, StockStatus, FEFODispatchAllocation } from '../types/inventory';

export function calculateDaysRemaining(expiryDateStr: string, simulatedDateStr: string): number {
  const exp = new Date(expiryDateStr);
  exp.setHours(0, 0, 0, 0);
  
  const current = new Date(simulatedDateStr);
  current.setHours(0, 0, 0, 0);

  const diffTime = exp.getTime() - current.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export interface StatusMeta {
  status: StockStatus;
  label: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  actionTip: string;
  urgencyLevel: number; // 4: kadaluwarsa, 3: kritis, 2: peringatan, 1: aman
  suggestedDiscount: number; // in percent
}

export function getStatusMeta(daysRemaining: number): StatusMeta {
  if (daysRemaining <= 0) {
    return {
      status: 'KADALUWARSA',
      label: daysRemaining === 0 ? 'Kedaluwarsa Hari Ini' : `Lewat ${Math.abs(daysRemaining)} Hari`,
      badgeBg: 'bg-rose-50 dark:bg-rose-950/40',
      badgeText: 'text-rose-700 dark:text-rose-400',
      borderColor: 'border-rose-200 dark:border-rose-800',
      actionTip: 'Tarik segera dari rak display! Pisahkan ke zona karantina/retur supplier.',
      urgencyLevel: 4,
      suggestedDiscount: 0,
    };
  }

  if (daysRemaining <= 7) {
    return {
      status: 'KRITIS',
      label: `${daysRemaining} Hari Lagi (Kritis)`,
      badgeBg: 'bg-amber-50 dark:bg-amber-950/40',
      badgeText: 'text-amber-800 dark:text-amber-400',
      borderColor: 'border-amber-200 dark:border-amber-800',
      actionTip: 'Flash Sale diskon 40%-60% atau bundling cepat sebelum melewati tanggal kadaluwarsa!',
      urgencyLevel: 3,
      suggestedDiscount: 50,
    };
  }

  if (daysRemaining <= 30) {
    return {
      status: 'PERINGATAN_DINI',
      label: `${daysRemaining} Hari Lagi (Waspada)`,
      badgeBg: 'bg-yellow-50 dark:bg-yellow-950/40',
      badgeText: 'text-yellow-800 dark:text-yellow-400',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      actionTip: 'Prioritaskan display di rak depan (Eye-Level). Buat promo beli 2 diskon 15%.',
      urgencyLevel: 2,
      suggestedDiscount: 20,
    };
  }

  return {
    status: 'AMAN',
    label: `${daysRemaining} Hari Lagi (Aman)`,
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    badgeText: 'text-emerald-700 dark:text-emerald-400',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    actionTip: 'Stok dalam kondisi optimal. Terapkan rotasi FEFO saat penataan rak barang.',
    urgencyLevel: 1,
    suggestedDiscount: 0,
  };
}

export function sortBatchesFEFO(batches: BatchItem[], simulatedDateStr: string): BatchItem[] {
  return [...batches].sort((a, b) => {
    const daysA = calculateDaysRemaining(a.expiryDate, simulatedDateStr);
    const daysB = calculateDaysRemaining(b.expiryDate, simulatedDateStr);
    
    // Sort ascending: smallest remaining days first (earliest expiry first)
    if (daysA !== daysB) {
      return daysA - daysB;
    }

    // Tie-breaker: earlier entry date first
    return new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime();
  });
}

export interface FEFODispatchResult {
  productId: string;
  productName: string;
  requestedQty: number;
  totalAllocated: number;
  isFulfilled: boolean;
  shortage: number;
  allocations: FEFODispatchAllocation[];
  suggestedActionNotice?: string;
}

export function calculateFEFODispatch(
  productId: string,
  requestedQty: number,
  allBatches: BatchItem[],
  simulatedDateStr: string
): FEFODispatchResult {
  const eligibleBatches = allBatches
    .filter((b) => b.productId === productId && b.currentStock > 0)
    .sort((a, b) => {
      const daysA = calculateDaysRemaining(a.expiryDate, simulatedDateStr);
      const daysB = calculateDaysRemaining(b.expiryDate, simulatedDateStr);
      return daysA - daysB;
    });

  let remainingToTake = requestedQty;
  const allocations: FEFODispatchAllocation[] = [];
  let totalAllocated = 0;

  for (const batch of eligibleBatches) {
    if (remainingToTake <= 0) break;

    const daysRemaining = calculateDaysRemaining(batch.expiryDate, simulatedDateStr);
    const statusMeta = getStatusMeta(daysRemaining);

    // If batch is already expired, warn the user
    const takeQty = Math.min(batch.currentStock, remainingToTake);
    allocations.push({
      batch,
      allocatedQty: takeQty,
      daysRemaining,
      status: statusMeta.status,
    });

    remainingToTake -= takeQty;
    totalAllocated += takeQty;
  }

  const isFulfilled = totalAllocated >= requestedQty;
  const shortage = Math.max(0, requestedQty - totalAllocated);

  const productName = eligibleBatches[0]?.productName || 'Produk';

  let notice = '';
  if (allocations.some((a) => a.daysRemaining <= 0)) {
    notice = 'PERINGATAN: Rekomendasi FEFO teratas mencakup batch yang sudah KEDALUWARSA! Pisahkan batch tersebut untuk retur/pemusnahan.';
  } else if (allocations.length > 1) {
    notice = `Stok diambil dari ${allocations.length} batch berbeda agar batch kadaluwarsa terdekat habis lebih dulu.`;
  }

  return {
    productId,
    productName,
    requestedQty,
    totalAllocated,
    isFulfilled,
    shortage,
    allocations,
    suggestedActionNotice: notice,
  };
}

export interface InventoryFinancials {
  totalBatches: number;
  totalUnits: number;
  totalCostValue: number;
  totalSellingValue: number;
  expiredBatchesCount: number;
  expiredUnitsCount: number;
  expiredLossValue: number;
  criticalBatchesCount: number;
  criticalUnitsCount: number;
  criticalRiskValue: number;
  warningBatchesCount: number;
  warningUnitsCount: number;
  warningRiskValue: number;
  safeBatchesCount: number;
}

export function computeFinancialMetrics(batches: BatchItem[], simulatedDateStr: string): InventoryFinancials {
  let totalUnits = 0;
  let totalCostValue = 0;
  let totalSellingValue = 0;

  let expiredBatchesCount = 0;
  let expiredUnitsCount = 0;
  let expiredLossValue = 0;

  let criticalBatchesCount = 0;
  let criticalUnitsCount = 0;
  let criticalRiskValue = 0;

  let warningBatchesCount = 0;
  let warningUnitsCount = 0;
  let warningRiskValue = 0;

  let safeBatchesCount = 0;

  for (const batch of batches) {
    if (batch.currentStock <= 0) continue;

    const days = calculateDaysRemaining(batch.expiryDate, simulatedDateStr);
    const cost = batch.currentStock * batch.costPrice;
    const sell = batch.currentStock * batch.sellingPrice;

    totalUnits += batch.currentStock;
    totalCostValue += cost;
    totalSellingValue += sell;

    if (days <= 0) {
      expiredBatchesCount++;
      expiredUnitsCount += batch.currentStock;
      expiredLossValue += cost;
    } else if (days <= 7) {
      criticalBatchesCount++;
      criticalUnitsCount += batch.currentStock;
      criticalRiskValue += cost;
    } else if (days <= 30) {
      warningBatchesCount++;
      warningUnitsCount += batch.currentStock;
      warningRiskValue += cost;
    } else {
      safeBatchesCount++;
    }
  }

  return {
    totalBatches: batches.filter((b) => b.currentStock > 0).length,
    totalUnits,
    totalCostValue,
    totalSellingValue,
    expiredBatchesCount,
    expiredUnitsCount,
    expiredLossValue,
    criticalBatchesCount,
    criticalUnitsCount,
    criticalRiskValue,
    warningBatchesCount,
    warningUnitsCount,
    warningRiskValue,
    safeBatchesCount,
  };
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateIndo(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}
