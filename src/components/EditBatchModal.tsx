import React, { useState, useEffect } from 'react';
import { X, Save, Edit } from 'lucide-react';
import { BatchItem } from '../types/inventory';
import { calculateDaysRemaining, getStatusMeta } from '../utils/fefoEngine';

interface EditBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: BatchItem | null;
  simulatedDate: string;
  onSave: (updatedBatch: BatchItem) => void;
}

export const EditBatchModal: React.FC<EditBatchModalProps> = ({
  isOpen,
  onClose,
  batch,
  simulatedDate,
  onSave,
}) => {
  if (!isOpen || !batch) return null;

  const [currentStock, setCurrentStock] = useState(batch.currentStock);
  const [expiryDate, setExpiryDate] = useState(batch.expiryDate);
  const [locationRack, setLocationRack] = useState(batch.locationRack);
  const [costPrice, setCostPrice] = useState(batch.costPrice);
  const [sellingPrice, setSellingPrice] = useState(batch.sellingPrice);
  const [supplierName, setSupplierName] = useState(batch.supplierName);
  const [supplierPhone, setSupplierPhone] = useState(batch.supplierPhone);
  const [notes, setNotes] = useState(batch.notes || '');

  useEffect(() => {
    setCurrentStock(batch.currentStock);
    setExpiryDate(batch.expiryDate);
    setLocationRack(batch.locationRack);
    setCostPrice(batch.costPrice);
    setSellingPrice(batch.sellingPrice);
    setSupplierName(batch.supplierName);
    setSupplierPhone(batch.supplierPhone);
    setNotes(batch.notes || '');
  }, [batch]);

  const days = calculateDaysRemaining(expiryDate, simulatedDate);
  const meta = getStatusMeta(days);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...batch,
      currentStock: Number(currentStock),
      expiryDate,
      locationRack: locationRack.trim(),
      costPrice: Number(costPrice),
      sellingPrice: Number(sellingPrice),
      supplierName: supplierName.trim(),
      supplierPhone: supplierPhone.trim(),
      notes: notes.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full p-6 text-slate-900 relative my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Ubah Data Batch {batch.batchNumber}
            </h2>
            <p className="text-xs text-slate-500">
              {batch.productName} ({batch.sku})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Sisa Stok Fisik ({batch.unit}):
              </label>
              <input
                type="number"
                min={0}
                required
                value={currentStock}
                onChange={(e) => setCurrentStock(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tanggal Kedaluwarsa (ED):
              </label>
              <input
                type="date"
                required
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono font-bold"
              />
            </div>
          </div>

          {/* Status Preview */}
          <div className={`p-2.5 rounded-lg border flex items-center justify-between ${meta.badgeBg} ${meta.borderColor}`}>
            <span className={`font-mono font-bold ${meta.badgeText}`}>{meta.label}</span>
            <span className="text-slate-600">Sisa {days} Hari</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Harga Modal (IDR):
              </label>
              <input
                type="number"
                min={0}
                required
                value={costPrice}
                onChange={(e) => setCostPrice(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Harga Jual (IDR):
              </label>
              <input
                type="number"
                min={0}
                required
                value={sellingPrice}
                onChange={(e) => setSellingPrice(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Lokasi Rak / Chiller:
            </label>
            <input
              type="text"
              value={locationRack}
              onChange={(e) => setLocationRack(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Suplier:
              </label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                No. WA Suplier:
              </label>
              <input
                type="text"
                value={supplierPhone}
                onChange={(e) => setSupplierPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Catatan:
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
