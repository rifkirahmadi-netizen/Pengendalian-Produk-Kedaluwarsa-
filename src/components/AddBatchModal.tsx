import React, { useState, useId } from 'react';
import { X, Plus, Calendar, AlertCircle } from 'lucide-react';
import { BatchItem, Product } from '../types/inventory';
import { calculateDaysRemaining, getStatusMeta } from '../utils/fefoEngine';

interface AddBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  simulatedDate: string;
  onAddBatch: (batch: Omit<BatchItem, 'id'>, newProduct?: Product) => void;
}

export const AddBatchModal: React.FC<AddBatchModalProps> = ({
  isOpen,
  onClose,
  products,
  simulatedDate,
  onAddBatch,
}) => {
  const [isCreatingNewProduct, setIsCreatingNewProduct] = useState(false);

  // Product Selection / Creation
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [newProductName, setNewProductName] = useState('');
  const [newProductSku, setNewProductSku] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('Makanan Kemasan');
  const [newProductUnit, setNewProductUnit] = useState('Pcs');

  // Batch Details
  const defaultBatchNo = `BATCH-${simulatedDate.replace(/-/g, '').slice(2, 6)}-${Math.floor(10 + Math.random() * 90)}`;
  const [batchNumber, setBatchNumber] = useState(defaultBatchNo);
  const [productionDate, setProductionDate] = useState(simulatedDate);
  const [entryDate, setEntryDate] = useState(simulatedDate);

  // Expiry date defaults to 3 months from entry date
  const defaultExp = new Date(simulatedDate);
  defaultExp.setMonth(defaultExp.getMonth() + 3);
  const defaultExpStr = defaultExp.toISOString().split('T')[0];
  const [expiryDate, setExpiryDate] = useState(defaultExpStr);

  const [initialStock, setInitialStock] = useState<number>(30);
  const [costPrice, setCostPrice] = useState<number>(15000);
  const [sellingPrice, setSellingPrice] = useState<number>(25000);
  const [locationRack, setLocationRack] = useState('Rak Utama A-01');
  const [supplierName, setSupplierName] = useState('CV Sumber Makmur Nusantara');
  const [supplierPhone, setSupplierPhone] = useState('081234567890');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const currentSelectedProduct = products.find((p) => p.id === selectedProductId);

  // Live calculation of remaining days
  const remainingDays = calculateDaysRemaining(expiryDate, simulatedDate);
  const statusMeta = getStatusMeta(remainingDays);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalProductId = selectedProductId;
    let finalProductName = currentSelectedProduct?.name || '';
    let finalSku = currentSelectedProduct?.sku || '';
    let finalCategory = currentSelectedProduct?.category || 'Makanan Kemasan';
    let finalUnit = currentSelectedProduct?.unit || 'Pcs';
    let newlyCreatedProduct: Product | undefined;

    if (isCreatingNewProduct) {
      if (!newProductName.trim()) return;
      finalProductId = `prod-${Date.now()}`;
      finalProductName = newProductName.trim();
      finalSku = newProductSku.trim() || `SKU-${Date.now().toString().slice(-5)}`;
      finalCategory = newProductCategory;
      finalUnit = newProductUnit;

      newlyCreatedProduct = {
        id: finalProductId,
        sku: finalSku,
        name: finalProductName,
        category: finalCategory,
        unit: finalUnit,
        minStockAlert: 10,
        sellingPriceRef: sellingPrice,
      };
    }

    const newBatch: Omit<BatchItem, 'id'> = {
      productId: finalProductId,
      productName: finalProductName,
      sku: finalSku,
      category: finalCategory,
      unit: finalUnit,
      batchNumber: batchNumber.trim(),
      productionDate,
      entryDate,
      expiryDate,
      initialStock: Number(initialStock),
      currentStock: Number(initialStock),
      costPrice: Number(costPrice),
      sellingPrice: Number(sellingPrice),
      locationRack: locationRack.trim(),
      supplierName: supplierName.trim(),
      supplierPhone: supplierPhone.trim(),
      notes: notes.trim(),
    };

    onAddBatch(newBatch, newlyCreatedProduct);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-2xl w-full p-6 text-slate-900 relative my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Penerimaan Stok & Registrasi Batch FEFO
            </h2>
            <p className="text-xs text-slate-500">
              Catat batch baru dengan tanggal kedaluwarsa untuk mengaktifkan pelacakan FEFO dan notifikasi WhatsApp otomatis.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Mode switch: Existing vs New Product */}
          <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span className="text-xs font-medium text-slate-700">Jenis Input:</span>
            <div className="inline-flex items-center bg-white border border-slate-200 rounded-md p-0.5">
              <button
                type="button"
                onClick={() => setIsCreatingNewProduct(false)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  !isCreatingNewProduct ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pilih Produk Terdaftar
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingNewProduct(true)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  isCreatingNewProduct ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                + Produk Baru
              </button>
            </div>
          </div>

          {!isCreatingNewProduct ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pilih Produk:
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-hidden focus:bg-white focus:border-slate-400"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) — {p.category} [{p.unit}]
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Produk Baru:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sambal Bawang Teri Barokah 150g"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 focus:outline-hidden focus:border-slate-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  SKU / Kode Barang:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: FNB-SMBL-02"
                  value={newProductSku}
                  onChange={(e) => setNewProductSku(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 font-mono uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategori:
                </label>
                <select
                  value={newProductCategory}
                  onChange={(e) => setNewProductCategory(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2"
                >
                  <option value="Makanan Kemasan">Makanan Kemasan</option>
                  <option value="Minuman Dingin">Minuman Dingin</option>
                  <option value="Roti & Pastry">Roti & Pastry</option>
                  <option value="Frozen Food">Frozen Food</option>
                  <option value="Camilan Kering">Camilan Kering</option>
                  <option value="Kosmetik & Skincare">Kosmetik & Skincare</option>
                  <option value="Bahan Baku Pangan">Bahan Baku Pangan</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Satuan:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Pcs, Jar, Botol, Pack"
                  value={newProductUnit}
                  onChange={(e) => setNewProductUnit(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2"
                />
              </div>
            </div>
          )}

          {/* Batch Number & Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor Batch:
              </label>
              <input
                type="text"
                required
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono uppercase font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Masuk:
              </label>
              <input
                type="date"
                required
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Kedaluwarsa (ED):
              </label>
              <input
                type="date"
                required
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono font-bold"
              />
            </div>
          </div>

          {/* Live Expiry Status Preview */}
          <div className={`p-2.5 rounded-lg border flex items-center justify-between text-xs ${statusMeta.badgeBg} ${statusMeta.borderColor}`}>
            <div className="flex items-center gap-2">
              <span className={`font-mono font-bold ${statusMeta.badgeText}`}>
                {statusMeta.label}
              </span>
              <span className="text-slate-600">· Status FEFO: <strong>{statusMeta.status}</strong></span>
            </div>
            <span className="text-[11px] text-slate-500">
              Sisa Waktu: <strong className="font-mono">{remainingDays} hari</strong>
            </span>
          </div>

          {/* Quantities & Prices */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jumlah Stok Masuk:
              </label>
              <input
                type="number"
                min={1}
                required
                value={initialStock}
                onChange={(e) => setInitialStock(parseInt(e.target.value) || 0)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Harga Modal (Beli/Unit):
              </label>
              <input
                type="number"
                min={0}
                required
                value={costPrice}
                onChange={(e) => setCostPrice(parseInt(e.target.value) || 0)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Harga Jual (Ref/Unit):
              </label>
              <input
                type="number"
                min={0}
                required
                value={sellingPrice}
                onChange={(e) => setSellingPrice(parseInt(e.target.value) || 0)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
              />
            </div>
          </div>

          {/* Storage & Supplier */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lokasi Rak / Penyimpanan:
              </label>
              <input
                type="text"
                placeholder="Contoh: Rak Depan A-01 / Chiller 2"
                value={locationRack}
                onChange={(e) => setLocationRack(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Suplier / Produsen:
              </label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                No. WhatsApp Suplier:
              </label>
              <input
                type="text"
                placeholder="0812xxxx (untuk retur WA)"
                value={supplierPhone}
                onChange={(e) => setSupplierPhone(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Khusus (Opsional):
            </label>
            <input
              type="text"
              placeholder="Contoh: Titipan konsinyasi / garansi retur maksimal H-7"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2"
            />
          </div>

          {/* Form Actions */}
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
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Simpan Batch ke Sistem FEFO</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
