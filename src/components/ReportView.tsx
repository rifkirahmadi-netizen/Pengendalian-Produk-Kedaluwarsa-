import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Calendar,
} from 'lucide-react';
import { BatchItem, StockMovement, AppSettings } from '../types/inventory';
import {
  calculateDaysRemaining,
  computeFinancialMetrics,
  formatDateIndo,
  formatRupiah,
  getStatusMeta,
} from '../utils/fefoEngine';

interface ReportViewProps {
  batches: BatchItem[];
  movements: StockMovement[];
  simulatedDate: string;
  settings: AppSettings;
}

export const ReportView: React.FC<ReportViewProps> = ({
  batches,
  movements,
  simulatedDate,
  settings,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'audit' | 'bast' | 'movements'>('audit');
  const financials = computeFinancialMetrics(batches, simulatedDate);

  const expiredItems = batches.filter(
    (b) => b.currentStock > 0 && calculateDaysRemaining(b.expiryDate, simulatedDate) <= 0
  );

  const criticalItems = batches.filter((b) => {
    if (b.currentStock <= 0) return false;
    const d = calculateDaysRemaining(b.expiryDate, simulatedDate);
    return d > 0 && d <= 7;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Laporan Pengendalian Kedaluwarsa & Audit FEFO
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dokumen resmi rekapitulasi umur simpan, Berita Acara Pemusnahan/Retur, dan log kepatuhan FEFO.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Subtabs */}
          <div className="inline-flex bg-white border border-slate-200 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setActiveSubTab('audit')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeSubTab === 'audit'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Rekapitulasi Audit
            </button>
            <button
              onClick={() => setActiveSubTab('bast')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeSubTab === 'bast'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Berita Acara (BAST)
            </button>
            <button
              onClick={() => setActiveSubTab('movements')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeSubTab === 'movements'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Log Mutasi FEFO
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Dokumen</span>
          </button>
        </div>
      </div>

      {/* Subtab 1: Rekapitulasi Audit */}
      {activeSubTab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          {/* Document Header */}
          <div className="border-b border-slate-200 pb-4 text-center sm:text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 uppercase tracking-wide">
                {settings.umkmName}
              </h3>
              <p className="text-xs text-slate-500">{settings.umkmAddress}</p>
              <p className="text-xs text-slate-600 mt-1">
                Laporan Hasil Pemeriksaan Rutin Pengendalian Mutu & Kedaluwarsa Produk (Metode FEFO)
              </p>
            </div>
            <div className="text-xs text-slate-500 sm:text-right font-mono">
              <div>Tanggal Periksa: <strong>{formatDateIndo(simulatedDate)}</strong></div>
              <div>Penanggung Jawab: <strong>{settings.warehouseName}</strong></div>
            </div>
          </div>

          {/* Metric Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block">Total Batch Diperiksa:</span>
              <span className="text-lg font-bold font-mono text-slate-900">{financials.totalBatches} batch</span>
            </div>
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200">
              <span className="text-rose-700 block">Batch Kedaluwarsa (Expired):</span>
              <span className="text-lg font-bold font-mono text-rose-700">{financials.expiredBatchesCount} batch</span>
              <span className="text-[11px] text-rose-600 block mt-0.5">{formatRupiah(financials.expiredLossValue)}</span>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
              <span className="text-amber-800 block">Batch Kritis (H-7):</span>
              <span className="text-lg font-bold font-mono text-amber-800">{financials.criticalBatchesCount} batch</span>
              <span className="text-[11px] text-amber-700 block mt-0.5">{formatRupiah(financials.criticalRiskValue)}</span>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <span className="text-emerald-800 block">Kondisi Aman (&gt;30 Hari):</span>
              <span className="text-lg font-bold font-mono text-emerald-800">{financials.safeBatchesCount} batch</span>
              <span className="text-[11px] text-emerald-700 block mt-0.5">Rotasi Terkendali</span>
            </div>
          </div>

          {/* Section: Daftar Barang Kedaluwarsa & Kritis */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Rincian Batch Kedaluwarsa & Kritis (Perlu Tindakan Khusus)
            </h4>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-semibold text-slate-600 border-b border-slate-200">
                    <th className="p-2.5">Produk</th>
                    <th className="p-2.5">No. Batch</th>
                    <th className="p-2.5">Tgl Expired</th>
                    <th className="p-2.5">Sisa Hari</th>
                    <th className="p-2.5 text-right">Stok</th>
                    <th className="p-2.5 text-right">Nilai Modal</th>
                    <th className="p-2.5">Status & Rekomendasi Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[...expiredItems, ...criticalItems].length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-500">
                        Tidak ada produk dalam kategori kedaluwarsa atau kritis.
                      </td>
                    </tr>
                  ) : (
                    [...expiredItems, ...criticalItems].map((item) => {
                      const days = calculateDaysRemaining(item.expiryDate, simulatedDate);
                      const meta = getStatusMeta(days);
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/70">
                          <td className="p-2.5 font-medium text-slate-900">{item.productName}</td>
                          <td className="p-2.5 font-mono text-slate-700">{item.batchNumber}</td>
                          <td className="p-2.5 font-mono">{formatDateIndo(item.expiryDate)}</td>
                          <td className="p-2.5 font-mono font-bold">
                            <span className={days <= 0 ? 'text-rose-700' : 'text-amber-800'}>
                              {days <= 0 ? `Lewat ${Math.abs(days)} hari` : `${days} hari lagi`}
                            </span>
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold">{item.currentStock} {item.unit}</td>
                          <td className="p-2.5 text-right font-mono">{formatRupiah(item.currentStock * item.costPrice)}</td>
                          <td className="p-2.5 text-slate-600">
                            <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold ${meta.badgeBg} ${meta.badgeText} mr-1.5`}>
                              {meta.status}
                            </span>
                            {meta.actionTip}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-8 grid grid-cols-2 text-center text-xs text-slate-700">
            <div>
              <p className="text-slate-500">Diperiksa Oleh (Gudang):</p>
              <div className="h-16" />
              <p className="font-bold underline text-slate-900">{settings.warehouseName}</p>
              <p className="text-[11px] text-slate-500">Kepala Inventori & Kontrol Mutu</p>
            </div>
            <div>
              <p className="text-slate-500">Mengetahui (Pimpinan UMKM):</p>
              <div className="h-16" />
              <p className="font-bold underline text-slate-900">{settings.ownerName}</p>
              <p className="text-[11px] text-slate-500">Owner / Direktur Usaha</p>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 2: BAST Pemusnahan / Retur */}
      {activeSubTab === 'bast' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-900 uppercase tracking-wide">
              BERITA ACARA PEMUSNAHAN / RETUR PRODUK KEDALUWARSA
            </h3>
            <p className="text-xs font-mono text-slate-500">
              Nomor: BAST-EXP/{simulatedDate.replace(/-/g, '')}/001
            </p>
            <p className="text-xs text-slate-600">
              Pada hari ini, <strong>{formatDateIndo(simulatedDate)}</strong>, bertempat di gudang {settings.umkmName}, telah dilakukan verifikasi penarikan barang kedaluwarsa sesuai SOP FEFO.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800">
              Daftar Barang yang Dimusnahkan / Dikeluarkan dari Stok Aktif:
            </h4>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-semibold text-slate-600 border-b border-slate-200">
                    <th className="p-2.5">No</th>
                    <th className="p-2.5">Nama Produk</th>
                    <th className="p-2.5">No. Batch</th>
                    <th className="p-2.5">Tgl Kedaluwarsa</th>
                    <th className="p-2.5 text-right">Jumlah Rusak</th>
                    <th className="p-2.5 text-right">Nilai Modal (IDR)</th>
                    <th className="p-2.5">Keterangan / Suplier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expiredItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-500">
                        Tidak ada barang kedaluwarsa yang perlu dimusnahkan pada tanggal ini.
                      </td>
                    </tr>
                  ) : (
                    expiredItems.map((item, idx) => (
                      <tr key={item.id}>
                        <td className="p-2.5 font-mono">{idx + 1}</td>
                        <td className="p-2.5 font-medium text-slate-900">{item.productName}</td>
                        <td className="p-2.5 font-mono">{item.batchNumber}</td>
                        <td className="p-2.5 font-mono text-rose-700">{formatDateIndo(item.expiryDate)}</td>
                        <td className="p-2.5 text-right font-mono font-bold">{item.currentStock} {item.unit}</td>
                        <td className="p-2.5 text-right font-mono">{formatRupiah(item.currentStock * item.costPrice)}</td>
                        <td className="p-2.5 text-slate-600">{item.supplierName} ({item.notes || 'Pemusnahan'})</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed italic">
            Demikian Berita Acara ini dibuat dengan sebenarnya dalam rangkap 2 (dua) untuk dipergunakan sebagai bukti pertanggungjawaban pembukuan keuangan dan penghapusan persediaan barang rusak.
          </p>

          <div className="pt-6 grid grid-cols-3 text-center text-xs text-slate-700">
            <div>
              <p className="text-slate-500">Petugas Gudang:</p>
              <div className="h-14" />
              <p className="font-bold underline text-slate-900">{settings.warehouseName}</p>
            </div>
            <div>
              <p className="text-slate-500">Saksi (Kasir Toko):</p>
              <div className="h-14" />
              <p className="font-bold underline text-slate-900">{settings.cashierName}</p>
            </div>
            <div>
              <p className="text-slate-500">Pimpinan / Pemilik:</p>
              <div className="h-14" />
              <p className="font-bold underline text-slate-900">{settings.ownerName}</p>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 3: Log Mutasi FEFO */}
      {activeSubTab === 'movements' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Audit Trail Kepatuhan Pengeluaran Stok (FEFO)
            </h3>
            <p className="text-xs text-slate-500">
              Setiap pengeluaran stok dicatat untuk memastikan petugas kasir dan gudang mematuhi urutan batch paling cepat kedaluwarsa.
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-semibold text-slate-600 border-b border-slate-200">
                  <th className="p-2.5">Waktu</th>
                  <th className="p-2.5">Produk</th>
                  <th className="p-2.5">No. Batch</th>
                  <th className="p-2.5">Tipe</th>
                  <th className="p-2.5 text-right">Jumlah</th>
                  <th className="p-2.5">Alasan</th>
                  <th className="p-2.5">Petugas</th>
                  <th className="p-2.5 text-center">Status FEFO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70">
                    <td className="p-2.5 font-mono text-slate-500">{m.timestamp}</td>
                    <td className="p-2.5 font-semibold text-slate-900">{m.productName}</td>
                    <td className="p-2.5 font-mono">{m.batchNumber}</td>
                    <td className="p-2.5">
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">
                        {m.type}
                      </span>
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold">{m.quantity}</td>
                    <td className="p-2.5 text-slate-600">{m.reason}</td>
                    <td className="p-2.5 text-slate-800 font-medium">{m.actor}</td>
                    <td className="p-2.5 text-center">
                      {m.isFefoCompliant ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>FEFO Sesuai</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          <span>Non-FEFO</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
