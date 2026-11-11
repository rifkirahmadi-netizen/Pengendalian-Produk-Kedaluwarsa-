import React from 'react';
import { X, Printer, QrCode } from 'lucide-react';
import { BatchItem } from '../types/inventory';
import { calculateDaysRemaining, formatDateIndo, getStatusMeta } from '../utils/fefoEngine';

interface BarcodeLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: BatchItem | null;
  simulatedDate: string;
  umkmName: string;
}

export const BarcodeLabelModal: React.FC<BarcodeLabelModalProps> = ({
  isOpen,
  onClose,
  batch,
  simulatedDate,
  umkmName,
}) => {
  if (!isOpen || !batch) return null;

  const days = calculateDaysRemaining(batch.expiryDate, simulatedDate);
  const meta = getStatusMeta(days);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 text-slate-900 relative my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-slate-700" />
            <h2 className="text-base font-bold text-slate-900">
              Label Rak & Barcode FEFO
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Physical Label Preview */}
        <div className="mt-4 flex flex-col items-center">
          <div
            id="fefo-printable-label"
            className="w-full bg-white border-2 border-slate-900 rounded-lg p-4 text-slate-900 shadow-xs print:m-0 print:border-black"
          >
            {/* Label Header */}
            <div className="border-b border-slate-300 pb-2 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  {umkmName}
                </span>
                <span className="text-xs font-bold text-slate-900 leading-tight block">
                  LABEL KONTROL FEFO GUDANG
                </span>
              </div>
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${meta.badgeBg} ${meta.badgeText} border`}>
                {meta.status}
              </span>
            </div>

            {/* Product details */}
            <div className="mt-2.5">
              <h3 className="text-sm font-bold text-slate-950 leading-snug">
                {batch.productName}
              </h3>
              <div className="flex items-center justify-between text-xs text-slate-600 mt-0.5">
                <span className="font-mono">SKU: {batch.sku}</span>
                <span>Rak: <strong>{batch.locationRack}</strong></span>
              </div>
            </div>

            {/* Prominent Expiry Date (The most important FEFO element) */}
            <div className="mt-3 p-2 bg-slate-100 rounded border border-slate-300 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-600 tracking-wider block">
                TANGGAL KEDALUWARSA (EXP DATE):
              </span>
              <span className="text-lg font-black font-mono tracking-wide text-slate-950 block">
                {formatDateIndo(batch.expiryDate)}
              </span>
              <span className="text-[11px] font-mono text-slate-600 block mt-0.5">
                (Sisa {days} Hari · Masuk: {formatDateIndo(batch.entryDate)})
              </span>
            </div>

            {/* Barcode & Batch ID representation */}
            <div className="mt-3 text-center">
              {/* Simulated Code128 Bars */}
              <div className="flex justify-center items-center h-10 gap-[2px] overflow-hidden my-1">
                {[
                  3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 4, 2, 1,
                  3, 2, 1, 4, 1, 2, 3, 1, 4, 2, 3, 1, 2, 4, 1, 3, 2, 1,
                ].map((w, i) => (
                  <div
                    key={i}
                    className="bg-black h-full"
                    style={{ width: `${w}px` }}
                  />
                ))}
              </div>
              <span className="text-xs font-mono font-bold tracking-widest text-slate-800">
                *{batch.batchNumber}*
              </span>
            </div>

            {/* Footer verification note */}
            <div className="mt-2 pt-2 border-t border-dashed border-slate-300 flex items-center justify-between text-[9px] text-slate-500">
              <span>SOP Rotasi: Ambil batch ini lebih dahulu</span>
              <span>Stok Awal: {batch.initialStock} {batch.unit}</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 mt-3 text-center">
            Ukuran stiker ideal: 70 x 50 mm atau 50 x 30 mm untuk ditempel pada rak display atau karton kemasan.
          </p>
        </div>

        {/* Modal Buttons */}
        <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Stiker Label</span>
          </button>
        </div>
      </div>
    </div>
  );
};
