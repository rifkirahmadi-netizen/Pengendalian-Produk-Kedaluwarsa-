import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Send,
  Printer,
  MinusCircle,
  Plus,
  Trash2,
  Edit,
  AlertTriangle,
  QrCode,
  ArrowUpDown,
  Download,
} from 'lucide-react';
import { BatchItem, StockStatus } from '../types/inventory';
import {
  calculateDaysRemaining,
  formatDateIndo,
  formatRupiah,
  getStatusMeta,
  sortBatchesFEFO,
} from '../utils/fefoEngine';

interface StockListViewProps {
  batches: BatchItem[];
  simulatedDate: string;
  onOpenAddBatch: () => void;
  onOpenSendWhatsApp: (batch: BatchItem) => void;
  onOpenBarcodeModal: (batch: BatchItem) => void;
  onOpenFefoDispatchForProduct?: (productId: string) => void;
  onEditBatch: (batch: BatchItem) => void;
  onDeleteBatch: (batchId: string) => void;
  initialStatusFilter?: string;
}

export const StockListView: React.FC<StockListViewProps> = ({
  batches,
  simulatedDate,
  onOpenAddBatch,
  onOpenSendWhatsApp,
  onOpenBarcodeModal,
  onOpenFefoDispatchForProduct,
  onEditBatch,
  onDeleteBatch,
  initialStatusFilter = 'ALL',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter);
  const [sortBy, setSortBy] = useState<'fefo' | 'entry' | 'stock' | 'value'>('fefo');

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set(batches.map((b) => b.category));
    return Array.from(set);
  }, [batches]);

  // Compute status counts
  const counts = useMemo(() => {
    let expired = 0;
    let critical = 0;
    let warning = 0;
    let safe = 0;

    batches.forEach((b) => {
      if (b.currentStock <= 0) return;
      const days = calculateDaysRemaining(b.expiryDate, simulatedDate);
      if (days <= 0) expired++;
      else if (days <= 7) critical++;
      else if (days <= 30) warning++;
      else safe++;
    });

    return {
      all: batches.filter((b) => b.currentStock > 0).length,
      expired,
      critical,
      warning,
      safe,
    };
  }, [batches, simulatedDate]);

  // Filter and sort items
  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      // Search
      const searchLower = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        b.productName.toLowerCase().includes(searchLower) ||
        b.batchNumber.toLowerCase().includes(searchLower) ||
        b.sku.toLowerCase().includes(searchLower) ||
        b.locationRack.toLowerCase().includes(searchLower) ||
        b.supplierName.toLowerCase().includes(searchLower);

      if (!matchSearch) return false;

      // Category
      if (categoryFilter !== 'ALL' && b.category !== categoryFilter) return false;

      // Status
      if (statusFilter !== 'ALL') {
        const days = calculateDaysRemaining(b.expiryDate, simulatedDate);
        const meta = getStatusMeta(days);
        if (meta.status !== statusFilter) return false;
      }

      return true;
    });
  }, [batches, searchTerm, categoryFilter, statusFilter, simulatedDate]);

  const sortedBatches = useMemo(() => {
    const list = [...filteredBatches];
    if (sortBy === 'fefo') {
      return sortBatchesFEFO(list, simulatedDate);
    }
    if (sortBy === 'entry') {
      return list.sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
    }
    if (sortBy === 'stock') {
      return list.sort((a, b) => b.currentStock - a.currentStock);
    }
    if (sortBy === 'value') {
      return list.sort((a, b) => b.currentStock * b.costPrice - a.currentStock * a.costPrice);
    }
    return list;
  }, [filteredBatches, sortBy, simulatedDate]);

  // Export CSV helper
  const handleExportCSV = () => {
    const headers = [
      'No Batch',
      'Nama Produk',
      'SKU',
      'Kategori',
      'Tgl Masuk',
      'Tgl Kedaluwarsa',
      'Sisa Hari',
      'Status FEFO',
      'Stok Sisa',
      'Satuan',
      'Harga Modal (IDR)',
      'Nilai Modal (IDR)',
      'Lokasi Rak',
      'Suplier',
      'Telepon Suplier',
    ];

    const rows = sortedBatches.map((b) => {
      const days = calculateDaysRemaining(b.expiryDate, simulatedDate);
      const meta = getStatusMeta(days);
      return [
        b.batchNumber,
        `"${b.productName.replace(/"/g, '""')}"`,
        b.sku,
        b.category,
        b.entryDate,
        b.expiryDate,
        days,
        meta.status,
        b.currentStock,
        b.unit,
        b.costPrice,
        b.currentStock * b.costPrice,
        `"${b.locationRack}"`,
        `"${b.supplierName}"`,
        b.supplierPhone,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_FEFO_Stok_${simulatedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalFilteredValue = sortedBatches.reduce(
    (sum, b) => sum + b.currentStock * b.costPrice,
    0
  );
  const totalFilteredUnits = sortedBatches.reduce((sum, b) => sum + b.currentStock, 0);

  return (
    <div className="space-y-4">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Daftar Stok & Batch Produk
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen batch berbasis First Expired First Out (FEFO) dengan pemantauan otomatis umur simpan.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Ekspor CSV</span>
          </button>
          <button
            onClick={onOpenAddBatch}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Batch</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3">
        {/* Interactive Segmented Filter Controls (Allowed buttons for state switching) */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-3">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Semua Batch ({counts.all})
          </button>
          <button
            onClick={() => setStatusFilter('KADALUWARSA')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              statusFilter === 'KADALUWARSA'
                ? 'bg-rose-700 text-white font-semibold'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            Kedaluwarsa ({counts.expired})
          </button>
          <button
            onClick={() => setStatusFilter('KRITIS')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              statusFilter === 'KRITIS'
                ? 'bg-amber-600 text-white font-semibold'
                : 'text-amber-800 hover:bg-amber-50'
            }`}
          >
            Kritis H-7 ({counts.critical})
          </button>
          <button
            onClick={() => setStatusFilter('PERINGATAN_DINI')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              statusFilter === 'PERINGATAN_DINI'
                ? 'bg-yellow-600 text-white font-semibold'
                : 'text-yellow-800 hover:bg-yellow-50'
            }`}
          >
            Waspada H-30 ({counts.warning})
          </button>
          <button
            onClick={() => setStatusFilter('AMAN')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              statusFilter === 'AMAN'
                ? 'bg-emerald-700 text-white font-semibold'
                : 'text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            Aman &gt;30 Hari ({counts.safe})
          </button>
        </div>

        {/* Search, Category, and Sorting Row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nama produk, no. batch, SKU, rak..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:border-slate-400"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:border-slate-400 text-slate-700"
            >
              <option value="ALL">Semua Kategori Produk</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:border-slate-400 text-slate-700 font-medium"
            >
              <option value="fefo">Urutkan: FEFO (ED Terdekat)</option>
              <option value="entry">Urutkan: Tanggal Masuk (Baru)</option>
              <option value="stock">Urutkan: Sisa Stok Terbanyak</option>
              <option value="value">Urutkan: Nilai Modal Tertinggi</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <th className="py-3 px-3 w-12 text-center">FEFO</th>
                <th className="py-3 px-3">Produk & SKU</th>
                <th className="py-3 px-3">No. Batch</th>
                <th className="py-3 px-3">Tanggal Expired & Sisa Hari</th>
                <th className="py-3 px-3">Lokasi Rak</th>
                <th className="py-3 px-3 text-right">Sisa Stok</th>
                <th className="py-3 px-3 text-right">Nilai Modal</th>
                <th className="py-3 px-3 text-center">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {sortedBatches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <p className="text-sm font-medium text-slate-700">Tidak ada data batch yang sesuai filter.</p>
                    <p className="text-xs text-slate-400 mt-1">Coba reset pencarian atau tambahkan stok batch baru.</p>
                  </td>
                </tr>
              ) : (
                sortedBatches.map((batch, index) => {
                  const days = calculateDaysRemaining(batch.expiryDate, simulatedDate);
                  const meta = getStatusMeta(days);
                  const costTotal = batch.currentStock * batch.costPrice;

                  return (
                    <tr
                      key={batch.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Priority Rank FEFO */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-400 tabular-nums">
                        #{index + 1}
                      </td>

                      {/* Product Name & SKU */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 group-hover:text-emerald-800 transition-colors">
                          {batch.productName}
                        </div>
                        <div className="text-[11px] text-slate-600 flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono">{batch.sku}</span>
                          <span aria-hidden="true">·</span>
                          <span>{batch.category}</span>
                        </div>
                      </td>

                      {/* Batch & Entry Date */}
                      <td className="py-3 px-3">
                        <span className="font-mono font-medium text-slate-800 block">
                          {batch.batchNumber}
                        </span>
                        <span className="text-[11px] text-slate-600">
                          Masuk: {formatDateIndo(batch.entryDate)}
                        </span>
                      </td>

                      {/* Expiry Date & Remaining Days with status */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${meta.badgeBg} ${meta.badgeText}`}>
                            {meta.label}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 mt-1">
                          ED: <strong className="font-mono text-slate-700">{formatDateIndo(batch.expiryDate)}</strong>
                        </div>
                      </td>

                      {/* Location Rack */}
                      <td className="py-3 px-3">
                        <span className="text-slate-800 font-medium block">
                          {batch.locationRack}
                        </span>
                        <span className="text-[11px] text-slate-600 truncate max-w-[140px] block" title={batch.supplierName}>
                          {batch.supplierName}
                        </span>
                      </td>

                      {/* Stock Level */}
                      <td className="py-3 px-3 text-right">
                        <span className="font-mono font-bold text-slate-900 tabular-nums text-sm block">
                          {batch.currentStock}
                        </span>
                        <span className="text-[11px] text-slate-600">
                          {batch.unit} (Awal: {batch.initialStock})
                        </span>
                      </td>

                      {/* Financial Value */}
                      <td className="py-3 px-3 text-right">
                        <span className="font-mono font-bold text-slate-900 tabular-nums block">
                          {formatRupiah(costTotal)}
                        </span>
                        <span className="text-[11px] text-slate-600 font-mono tabular-nums">
                          @{formatRupiah(batch.costPrice)}
                        </span>
                      </td>

                      {/* Quick Actions */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => onOpenSendWhatsApp(batch)}
                            title="Kirim Notifikasi WhatsApp untuk Batch Ini"
                            className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onOpenBarcodeModal(batch)}
                            title="Cetak Label QR & Barcode FEFO"
                            className="p-1.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEditBatch(batch)}
                            title="Edit Batch"
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Hapus batch ${batch.batchNumber} (${batch.productName})?`)) {
                                onDeleteBatch(batch.id);
                              }
                            }}
                            title="Hapus Batch"
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info strip */}
        <div className="bg-slate-50/80 px-4 py-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Menampilkan <strong className="font-mono text-slate-900">{sortedBatches.length}</strong> dari {batches.length} batch
          </div>
          <div className="flex items-center gap-4">
            <div>
              Total Fisik: <strong className="font-mono text-slate-900 tabular-nums">{totalFilteredUnits} unit</strong>
            </div>
            <div>
              Total Nilai Modal: <strong className="font-mono text-slate-900 tabular-nums">{formatRupiah(totalFilteredValue)}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
