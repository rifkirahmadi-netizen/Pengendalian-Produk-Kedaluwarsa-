import { BatchItem, WhatsAppLogItem, AppSettings } from '../types/inventory';
import { calculateDaysRemaining, formatDateIndo, formatRupiah, getStatusMeta } from './fefoEngine';

export function cleanPhoneNumber(rawPhone: string): string {
  let cleaned = rawPhone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  }
  if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

export function buildWhatsAppMessage(
  batch: BatchItem,
  simulatedDateStr: string,
  umkmName: string,
  alertType: 'H-30' | 'H-14' | 'H-7' | 'H-3' | 'H-0' | 'RETUR' | 'MANUAL',
  recipientRole: 'owner' | 'gudang' | 'kasir' | 'supplier'
): string {
  const days = calculateDaysRemaining(batch.expiryDate, simulatedDateStr);
  const statusMeta = getStatusMeta(days);
  const totalCost = batch.currentStock * batch.costPrice;

  if (alertType === 'RETUR' || recipientRole === 'supplier') {
    return `*PERMOHONAN RETUR BARANG KEDALUWARSA / NEAR EXP*
Kepada Yth. *${batch.supplierName}*
Dari: *${umkmName}*

Dengan hormat, kami menginformasikan produk berikut yang telah mendekati / melewati batas tanggal kedaluwarsa:

📦 *Detail Barang:*
• Nama Produk: *${batch.productName}*
• SKU: ${batch.sku}
• No. Batch: *${batch.batchNumber}*
• Tanggal Kedaluwarsa: *${formatDateIndo(batch.expiryDate)}* (${days <= 0 ? 'Sudah Expired' : `${days} hari lagi`})
• Jumlah Stok Retur: *${batch.currentStock} ${batch.unit}*
• Estimasi Nilai Modal: ${formatRupiah(totalCost)}
• Lokasi Simpan: ${batch.locationRack}

Mohon konfirmasi jadwal penjemputan barang atau mekanisme penggantian batch baru sesuai kesepakatan retur UMKM kami.

Terima kasih atas kerjasamanya.
_Sistem Otomasi FEFO ${umkmName}_`;
  }

  let alertTitle = '⚠️ PERINGATAN KEDALUWARSA STOK (FEFO)';
  if (days <= 0) {
    alertTitle = '🚨 PERINGATAN: STOK TELAH KEDALUWARSA (H-0)';
  } else if (days <= 3) {
    alertTitle = '🔥 TINDAKAN MENDESAK: STOK SEGERA KEDALUWARSA (H-3)';
  } else if (days <= 7) {
    alertTitle = '⚡ PERINGATAN KRITIS: STOK KEDALUWARSA DALAM 7 HARI (H-7)';
  } else if (days <= 14) {
    alertTitle = '📢 PERINGATAN DINI: EVALUASI STOK 14 HARI (H-14)';
  } else if (days <= 30) {
    alertTitle = 'ℹ️ MONITORING FEFO: 30 HARI JELANG KEDALUWARSA (H-30)';
  }

  return `*${alertTitle}*
Unit Usaha: *${umkmName}*
Tanggal Sistem: ${formatDateIndo(simulatedDateStr)}

📦 *Informasi Stok & Batch:*
• Produk: *${batch.productName}*
• No. Batch: *${batch.batchNumber}*
• Sisa Hari: *${days <= 0 ? `LEWAT ${Math.abs(days)} HARI` : `${days} Hari Lagi`}*
• Tanggal Expired: *${formatDateIndo(batch.expiryDate)}*
• Sisa Stok di Rak: *${batch.currentStock} ${batch.unit}*
• Lokasi Rak: *${batch.locationRack}*
• Nilai Modal Terancam: *${formatRupiah(totalCost)}*

💡 *Rekomendasi Aksi FEFO:*
${statusMeta.actionTip}

${days > 0 && days <= 7 ? `🏷️ _Saran Diskon Kasir: Potong harga ~${statusMeta.suggestedDiscount}% untuk percepatan penjualan hari ini!_\n` : ''}${days <= 0 ? `🛑 _Instruksi Gudang: Pindahkan sekarang juga ke tempat sampah terpisah / karantina retur!_\n` : ''}
_Notifikasi Otomatis Sistem FEFO StockGuard_`;
}

export function createWhatsAppDirectUrl(phoneNumber: string, message: string): string {
  const cleanPhone = cleanPhoneNumber(phoneNumber);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export interface ScanAlertResult {
  batch: BatchItem;
  alertType: 'H-30' | 'H-14' | 'H-7' | 'H-3' | 'H-0';
  daysRemaining: number;
  recipientPhone: string;
  recipientName: string;
  recipientRole: 'owner' | 'gudang' | 'kasir' | 'supplier';
  messageText: string;
  waDirectUrl: string;
}

export function scanBatchesForDailyAlerts(
  batches: BatchItem[],
  settings: AppSettings,
  simulatedDateStr: string
): ScanAlertResult[] {
  const alerts: ScanAlertResult[] = [];
  const thresholds = settings.autoNotifyDays || [30, 14, 7, 3, 0];

  for (const batch of batches) {
    if (batch.currentStock <= 0) continue;

    const days = calculateDaysRemaining(batch.expiryDate, simulatedDateStr);

    let matchedThreshold: number | null = null;
    let alertType: 'H-30' | 'H-14' | 'H-7' | 'H-3' | 'H-0' | null = null;

    if (days <= 0 && thresholds.includes(0)) {
      matchedThreshold = 0;
      alertType = 'H-0';
    } else if (days <= 3 && thresholds.includes(3)) {
      matchedThreshold = 3;
      alertType = 'H-3';
    } else if (days <= 7 && thresholds.includes(7)) {
      matchedThreshold = 7;
      alertType = 'H-7';
    } else if (days <= 14 && thresholds.includes(14)) {
      matchedThreshold = 14;
      alertType = 'H-14';
    } else if (days <= 30 && thresholds.includes(30)) {
      matchedThreshold = 30;
      alertType = 'H-30';
    }

    if (alertType && matchedThreshold !== null) {
      // Determine primary recipient:
      // If expired (H-0) or urgent H-3: notify warehouse and owner
      let recipientPhone = settings.warehousePhone || settings.ownerPhone;
      let recipientName = settings.warehouseName || settings.ownerName;
      let recipientRole: 'owner' | 'gudang' | 'kasir' | 'supplier' = 'gudang';

      if (days <= 0) {
        recipientRole = 'owner';
        recipientPhone = settings.ownerPhone;
        recipientName = settings.ownerName;
      } else if (days <= 7) {
        recipientRole = 'kasir';
        recipientPhone = settings.cashierPhone || settings.warehousePhone;
        recipientName = settings.cashierName || settings.warehouseName;
      }

      const msg = buildWhatsAppMessage(batch, simulatedDateStr, settings.umkmName, alertType, recipientRole);
      const url = createWhatsAppDirectUrl(recipientPhone, msg);

      alerts.push({
        batch,
        alertType,
        daysRemaining: days,
        recipientPhone,
        recipientName,
        recipientRole,
        messageText: msg,
        waDirectUrl: url,
      });
    }
  }

  return alerts;
}

export async function sendWhatsAppViaProvider(
  endpointUrl: string,
  apiKey: string,
  provider: 'wa_direct' | 'fonnte' | 'wablas' | 'custom_webhook',
  phone: string,
  message: string
): Promise<{ success: boolean; rawResponse?: any; error?: string }> {
  const cleanPhone = cleanPhoneNumber(phone);

  // If user configured a real webhook endpoint or gateway
  if (provider === 'custom_webhook' && endpointUrl) {
    try {
      const res = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: apiKey } : {}),
        },
        body: JSON.stringify({
          target: cleanPhone,
          message,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Gagal mengirim ke custom webhook' };
    }
  }

  // Simulated gateway latency for Fonnte / Wablas / Direct
  await new Promise((resolve) => setTimeout(resolve, 600));

  return {
    success: true,
    rawResponse: {
      provider,
      target: cleanPhone,
      status: 'SENT_OK',
      timestamp: new Date().toISOString(),
    },
  };
}
