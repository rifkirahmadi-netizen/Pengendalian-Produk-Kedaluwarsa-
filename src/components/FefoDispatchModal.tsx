import React, { useState, useMemo } from 'react';
import {
  X,
  Layers,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Boxes,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { BatchItem, Product } from '../types/inventory';
import {
  calculateDaysRemaining,
  calculateFEFODispatch,
  formatDateIndo,
  formatRupiah,
  getStatusMeta,
} from '../utils/fefoEngine';

interface FefoDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  batches: BatchItem[];
  simulatedDate: string;
  onConfirmDispatch: (
    productId: string,
    allocations: { batchId: string; quantity: number }[],
    reason: string,
    actor: string
  ) => void;
  defaultProductId?: string;
}

export const FefoDispatchModal: React.FC<FefoDispatchModalProps> = ({
  isOpen,
  onClose,
  products,
  batches,
  simulatedDate,
  onConfirmDispatch,
  defaultProductId,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(
    defaultProductId || products[0]?.id || ''
  );
  const [requestQty, setRequestQty] = useState<number>(1);
  const [reason, setReason] = useState<string>('Penjualan Kasir');
  const [actor, setActor] = useState<string>('Kasir Toko (FEFO)');

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId),
    [products, selectedProductId]
  );

  // Available batches for this product
  const productBatches = useMemo(
    () =>
      batches.filter((b) => b.productId === selectedProductId && b.currentStock > 0),
    [batches, selectedProductId]
  );

  const totalStockAvailable = useMemo(
    () => productBatches.reduce((sum, b) => sum + b.currentStock, 0),
    [productBatches]
  );

  // Compute live FEFO allocation
  const dispatchPlan = useMemo(() => {
    if (!selectedProductId || requestQty <= 0) return null;
    return calculateFEFODispatch(
      selectedProductId,
      requestQty,
      batches,
      simulatedDate
    );
  }, [selectedProductId, requestQty, batches, simulatedDate]);

  if (!isOpen) return null;

  const handleExecute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchPlan || dispatchPlan.allocations.length === 0) return;

    const allocations = dispatchPlan.allocations.map((a) => ({
      batchId: a.batch.id,
      quantity: a.allocatedQty,
    }));

    onConfirmDispatch(selectedProductId, allocations, reason, actor);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-2xl w-full p-6 text-slate-900 relative my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Pengeluaran Stok Berbasis FEFO
              </h2>
              <p className="text-xs text-slate-500">
                Sistem otomatis memilih batch dengan tanggal kedaluwarsa terdekat untuk dikeluarkan lebih dulu.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleExecute} className="mt-4 space-y-4">
          {/* Product selector & Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pilih Produk yang Dikeluarkan:
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  setRequestQty(1);
                }}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-hidden focus:bg-white focus:border-slate-400 font-medium"
              >
                {products.map((p) => {
                  const stock = batches
                    .filter((b) => b.productId === p.id)
                    .reduce((sum, b) => sum + b.currentStock, 0);
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name} (Tersedia: {stock} {p.unit})
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jumlah Diambil:
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  min={1}
                  max={totalStockAvailable || 1}
                  value={requestQty}
                  onChange={(e) => setRequestQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-hidden focus:bg-white focus:border-slate-400 font-mono font-bold"
                />
                <span className="ml-2 text-xs text-slate-500 whitespace-nowrap">
                  {selectedProduct?.unit}
                </span>
              </div>
            </div>
          </div>

          {/* Reason & Actor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tujuan Pengeluaran:
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-hidden focus:bg-white focus:border-slate-400"
              >
                <option value="Penjualan Kasir">Penjualan Kasir Reguler</option>
                <option value="Flash Sale / Promo FEFO">Flash Sale / Diskon Cuci Gudang FEFO</option>
                <option value="Mutasi Display Rak Depan">Mutasi Display Rak Depan</option>
                <option value="Retur ke Suplier">Retur ke Suplier (Near-Expired)</option>
                <option value="Pemusnahan Barang Expired">Pemusnahan / Buang Barang Expired</option>
                <option value="Sampel / Donasi Terarah">Sampel Tester / Donasi</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Petugas / Penanggung Jawab:
              </label>
              <input
                type="text"
                value={actor}
                onChange={(e) => setActor(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-hidden focus:bg-white focus:border-slate-400"
              />
            </div>
          </div>

          {/* Algoritma Rekomendasi FEFO Output Box */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Rekomendasi Pengambilan Batch FEFO</span>
              </span>
              <span className="text-[11px] text-slate-500">
                Total Tersedia: <strong className="font-mono text-slate-800">{totalStockAvailable} {selectedProduct?.unit}</strong>
              </span>
            </div>

            {totalStockAvailable === 0 ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
                Stok fisik untuk produk ini saat ini HABIS (0 {selectedProduct?.unit}).
              </div>
            ) : dispatchPlan && dispatchPlan.allocations.length > 0 ? (
              <div className="space-y-2">
                {dispatchPlan.allocations.map((alloc, idx) => {
                  const meta = getStatusMeta(alloc.daysRemaining);
                  const isExp = alloc.daysRemaining <= 0;

                  return (
                    <div
                      key={alloc.batch.id}
                      className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                        isExp
                          ? 'bg-rose-50 border-rose-200'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="font-mono font-bold text-slate-400 pt-0.5">
                          #{idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">
                              {alloc.batch.batchNumber}
                            </span>
                            <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded ${meta.badgeBg} ${meta.badgeText}`}>
                              {meta.label}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                            <span>ED: <strong className="font-mono">{formatDateIndo(alloc.batch.expiryDate)}</strong></span>
                            <span>·</span>
                            <span>Lokasi: <strong>{alloc.batch.locationRack}</strong></span>
                            <span>·</span>
                            <span>Sisa di rak: {alloc.batch.currentStock} {alloc.batch.unit}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right sm:self-center shrink-0">
                        <span className="text-xs text-slate-500 block">Ambil dari batch ini:</span>
                        <span className="text-sm font-mono font-bold text-emerald-700">
                          {alloc.allocatedQty} {alloc.batch.unit}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {dispatchPlan.suggestedActionNotice && (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{dispatchPlan.suggestedActionNotice}</span>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={
                totalStockAvailable === 0 ||
                !dispatchPlan ||
                dispatchPlan.allocations.length === 0
              }
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Konfirmasi Ambil Sesuai FEFO</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
