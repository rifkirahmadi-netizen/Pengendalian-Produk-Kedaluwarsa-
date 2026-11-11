import React from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  Clock,
  ShieldCheck,
  TrendingDown,
  Layers,
  Send,
  Boxes,
  ArrowRight,
  ExternalLink,
  Percent,
} from 'lucide-react';
import { BatchItem, WhatsAppLogItem, AppSettings } from '../types/inventory';
import {
  calculateDaysRemaining,
  computeFinancialMetrics,
  formatDateIndo,
  formatRupiah,
  getStatusMeta,
  sortBatchesFEFO,
} from '../utils/fefoEngine';

interface DashboardViewProps {
  batches: BatchItem[];
  simulatedDate: string;
  settings: AppSettings;
  whatsAppLogs: WhatsAppLogItem[];
  onOpenFefoDispatch: () => void;
  onOpenSendWhatsApp: (batch: BatchItem) => void;
  onNavigateToStock: (filterStatus?: string) => void;
  onNavigateToWhatsApp: () => void;
  onTriggerDailyScan: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  batches,
  simulatedDate,
  settings,
  whatsAppLogs,
  onOpenFefoDispatch,
  onOpenSendWhatsApp,
  onNavigateToStock,
  onNavigateToWhatsApp,
  onTriggerDailyScan,
}) => {
  const financials = computeFinancialMetrics(batches, simulatedDate);
  const fefoSorted = sortBatchesFEFO(
    batches.filter((b) => b.currentStock > 0),
    simulatedDate
  );

  const topFefoItems = fefoSorted.slice(0, 6);
  const urgentCount = financials.expiredBatchesCount + financials.criticalBatchesCount;

  return (
    <div className="space-y-6">
      {/* 1. Urgent Action Alert (if any batch is expired or critical) */}
      {urgentCount > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 sm:p-5 text-slate-900">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-rose-950">
                  Tindakan FEFO Diperlukan: {financials.expiredBatchesCount} Batch Kedaluwarsa & {financials.criticalBatchesCount} Batch Kritis
                </h2>
                <p className="text-xs sm:text-sm text-rose-800 mt-0.5">
                  Terdapat total kerugian modal kedaluwarsa{' '}
                  <span className="font-mono font-bold tabular-nums">
                    {formatRupiah(financials.expiredLossValue)}
                  </span>{' '}
                  dan nilai stok berisiko tinggi{' '}
                  <span className="font-mono font-bold tabular-nums">
                    {formatRupiah(financials.criticalRiskValue)}
                  </span>
                  . Segera jalankan rotasi stok ke display depan atau ajukan retur supplier!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onNavigateToStock('KADALUWARSA')}
                className="px-3 py-1.5 text-xs font-semibold text-rose-900 bg-white border border-rose-300 rounded-lg hover:bg-rose-50 transition-colors whitespace-nowrap"
              >
                Tinjau Barang Expired
              </button>
              <button
                onClick={onTriggerDailyScan}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors whitespace-nowrap shadow-xs"
              >
                Kirim Alert WA Otomatis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Key Metrics Row (Single-Elevation Depth, Tabular Numerals) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Stock Value */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Total Nilai Modal Stok</span>
            <Boxes className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-slate-900 tabular-nums">
              {formatRupiah(financials.totalCostValue)}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
            <span className="font-mono font-medium text-slate-700 tabular-nums">{financials.totalBatches}</span>
            <span>batch</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono font-medium text-slate-700 tabular-nums">{financials.totalUnits}</span>
            <span>total unit</span>
          </div>
        </div>

        {/* Metric 2: Expired Loss (Zona Merah) */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-rose-600 font-medium">
            <span>Potensi Kerugian Kedaluwarsa</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-rose-600 tabular-nums">
              {formatRupiah(financials.expiredLossValue)}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
            <span className="font-mono font-bold text-rose-600 tabular-nums">{financials.expiredBatchesCount}</span>
            <span>batch kedaluwarsa</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono font-medium text-slate-700 tabular-nums">{financials.expiredUnitsCount}</span>
            <span>unit</span>
          </div>
        </div>

        {/* Metric 3: Critical H-7 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-amber-700 font-medium">
            <span>Stok Kritis (H-1 s/d H-7)</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-amber-600 tabular-nums">
              {formatRupiah(financials.criticalRiskValue)}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
            <span className="font-mono font-bold text-amber-700 tabular-nums">{financials.criticalBatchesCount}</span>
            <span>batch kritis</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono font-medium text-slate-700 tabular-nums">{financials.criticalUnitsCount}</span>
            <span>unit</span>
          </div>
        </div>

        {/* Metric 4: Safe vs Early Warning */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-emerald-700 font-medium">
            <span>Stok Aman (&gt;30 Hari)</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-emerald-600 tabular-nums">
              {financials.safeBatchesCount}
            </span>
            <span className="text-xs text-slate-500">
              Waspada H-30: <strong className="font-mono text-slate-800">{financials.warningBatchesCount}</strong>
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
            <span>Rotasi FEFO berjalan</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-700 font-medium">Kualitas Terjaga</span>
          </div>
        </div>
      </div>

      {/* 3. Main Split Section: FEFO Priority Queue & Fast Action Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): FEFO Priority Queue (Batch Wajib Keluar Duluan) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Antrean Prioritas FEFO (First Expired, First Out)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Urutan batch barang yang harus dikeluarkan/dijual lebih dulu hari ini berdasarkan tanggal kadaluwarsa terdekat.
              </p>
            </div>
            <button
              onClick={onOpenFefoDispatch}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap self-start sm:self-auto"
            >
              Kasir / Ambil Stok FEFO
            </button>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {topFefoItems.map((batch, index) => {
              const days = calculateDaysRemaining(batch.expiryDate, simulatedDate);
              const meta = getStatusMeta(days);

              return (
                <div
                  key={batch.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 rounded-lg px-2 -mx-2 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="font-mono font-bold text-xs text-slate-400 w-5 pt-0.5 tabular-nums">
                      #{index + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-900 truncate">
                          {batch.productName}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          {batch.batchNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 flex-wrap">
                        <span>ED: <strong className="font-mono text-slate-700">{formatDateIndo(batch.expiryDate)}</strong></span>
                        <span aria-hidden="true">·</span>
                        <span>Lokasi: <span className="text-slate-700 font-medium">{batch.locationRack}</span></span>
                        <span aria-hidden="true">·</span>
                        <span>Sisa: <strong className="font-mono text-slate-900">{batch.currentStock} {batch.unit}</strong></span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 italic">
                        💡 {meta.actionTip}
                      </p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                    <div className="text-right">
                      <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${meta.badgeBg} ${meta.badgeText}`}>
                        {meta.label}
                      </span>
                      {meta.suggestedDiscount > 0 && (
                        <span className="block text-[11px] text-amber-700 font-medium mt-0.5">
                          Saran Diskon: -{meta.suggestedDiscount}%
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onOpenSendWhatsApp(batch)}
                        title="Kirim Peringatan WhatsApp untuk Batch Ini"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 transition-colors whitespace-nowrap"
                      >
                        <Send className="w-3 h-3 text-emerald-600" />
                        <span>Kirim WA</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Menampilkan 6 batch prioritas FEFO teratas</span>
            <button
              onClick={() => onNavigateToStock()}
              className="text-slate-900 hover:text-emerald-700 font-medium inline-flex items-center gap-1"
            >
              <span>Lihat Semua {batches.length} Batch</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column (1 Col): WhatsApp Automation Center Quick Card & Strategy */}
        <div className="space-y-6">
          {/* Card A: Status WhatsApp Gateway */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-600" />
                <span>Status Otomasi WhatsApp</span>
              </h2>
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                AKTIF
              </span>
            </div>

            <div className="mt-3 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span>Moda Pengiriman:</span>
                <span className="font-semibold text-slate-900">
                  {settings.whatsappProvider === 'wa_direct' ? 'WhatsApp Direct Web / App' : 'Gateway API Terkoneksi'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span>Penerima Gudang:</span>
                <span className="font-mono text-slate-800">{settings.warehousePhone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span>Penerima Kasir:</span>
                <span className="font-mono text-slate-800">{settings.cashierPhone}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Batas Hari Notif:</span>
                <span className="font-mono font-bold text-slate-900">
                  {settings.autoNotifyDays.map((d) => `H-${d}`).join(', ')}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
              <button
                onClick={onTriggerDailyScan}
                className="w-full py-2 px-3 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Pindai & Kirim Notifikasi Hari Ini</span>
              </button>
              <button
                onClick={onNavigateToWhatsApp}
                className="w-full py-1.5 px-3 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors text-center"
              >
                Konfigurasi Gateway & Riwayat Pesan
              </button>
            </div>
          </div>

          {/* Card B: Prinsip FEFO UMKM */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 space-y-2">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-slate-700" />
              <span>Strategi Penyelamatan Margin FEFO</span>
            </h3>
            <p className="leading-relaxed text-slate-600">
              Sistem FEFO memastikan produk dengan tanggal kedaluwarsa paling dekat wajib dikeluarkan pertama kali. Untuk produk &lt;7 hari, terapkan potongan diskon sebelum barang expired menjadi kerugian 100%.
            </p>
            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
              <span>Kepatuhan FEFO Kasir:</span>
              <strong className="text-emerald-700 font-mono">100% Terkawal</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
