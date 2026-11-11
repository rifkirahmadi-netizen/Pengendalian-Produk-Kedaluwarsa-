import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  ExternalLink,
  Copy,
  Check,
  MessageSquare,
  User,
  Building,
  Clock,
  Sparkles,
} from 'lucide-react';
import { BatchItem, AppSettings, WhatsAppLogItem } from '../types/inventory';
import {
  buildWhatsAppMessage,
  createWhatsAppDirectUrl,
  sendWhatsAppViaProvider,
} from '../utils/whatsappService';
import { calculateDaysRemaining } from '../utils/fefoEngine';

interface SendWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: BatchItem | null;
  settings: AppSettings;
  simulatedDate: string;
  onRecordLog: (log: WhatsAppLogItem) => void;
}

export const SendWhatsAppModal: React.FC<SendWhatsAppModalProps> = ({
  isOpen,
  onClose,
  batch,
  settings,
  simulatedDate,
  onRecordLog,
}) => {
  if (!isOpen || !batch) return null;

  const days = calculateDaysRemaining(batch.expiryDate, simulatedDate);

  // Default alert type based on days
  let defaultType: 'H-30' | 'H-14' | 'H-7' | 'H-3' | 'H-0' | 'RETUR' | 'MANUAL' = 'H-30';
  if (days <= 0) defaultType = 'H-0';
  else if (days <= 3) defaultType = 'H-3';
  else if (days <= 7) defaultType = 'H-7';
  else if (days <= 14) defaultType = 'H-14';

  const [alertType, setAlertType] = useState<
    'H-30' | 'H-14' | 'H-7' | 'H-3' | 'H-0' | 'RETUR' | 'MANUAL'
  >(defaultType);

  const [recipientRole, setRecipientRole] = useState<'owner' | 'gudang' | 'kasir' | 'supplier' | 'custom'>(
    days <= 0 ? 'owner' : days <= 7 ? 'kasir' : 'gudang'
  );

  const [customPhone, setCustomPhone] = useState('');
  const [customName, setCustomName] = useState('');
  const [copied, setCopied] = useState(false);
  const [sendingState, setSendingState] = useState<'idle' | 'sending' | 'success'>('idle');

  // Resolve target phone & name
  let targetPhone = '';
  let targetName = '';

  if (recipientRole === 'owner') {
    targetPhone = settings.ownerPhone;
    targetName = settings.ownerName;
  } else if (recipientRole === 'gudang') {
    targetPhone = settings.warehousePhone;
    targetName = settings.warehouseName;
  } else if (recipientRole === 'kasir') {
    targetPhone = settings.cashierPhone;
    targetName = settings.cashierName;
  } else if (recipientRole === 'supplier') {
    targetPhone = batch.supplierPhone;
    targetName = batch.supplierName;
  } else {
    targetPhone = customPhone;
    targetName = customName || 'Kontak Khusus';
  }

  // Generated message
  const [message, setMessage] = useState('');

  useEffect(() => {
    const roleForMsg = recipientRole === 'custom' ? 'gudang' : recipientRole;
    const msg = buildWhatsAppMessage(batch, simulatedDate, settings.umkmName, alertType, roleForMsg);
    setMessage(msg);
  }, [batch, simulatedDate, settings.umkmName, alertType, recipientRole]);

  const directWaUrl = createWhatsAppDirectUrl(targetPhone, message);

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendViaGateway = async () => {
    setSendingState('sending');
    const res = await sendWhatsAppViaProvider(
      settings.customWebhookUrl,
      settings.apiKey,
      settings.whatsappProvider,
      targetPhone,
      message
    );

    const log: WhatsAppLogItem = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      productName: batch.productName,
      recipientPhone: targetPhone,
      recipientName: targetName,
      recipientRole: recipientRole === 'custom' ? 'gudang' : recipientRole,
      alertType,
      messageText: message,
      status: res.success ? 'Terkirim' : 'Gagal',
      provider: settings.whatsappProvider,
    };

    onRecordLog(log);
    setSendingState('success');
    setTimeout(() => {
      setSendingState('idle');
      onClose();
    }, 1200);
  };

  const handleOpenDirectWhatsApp = () => {
    const log: WhatsAppLogItem = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      productName: batch.productName,
      recipientPhone: targetPhone,
      recipientName: targetName,
      recipientRole: recipientRole === 'custom' ? 'gudang' : recipientRole,
      alertType,
      messageText: message,
      status: 'Terkirim',
      provider: 'wa_direct',
    };
    onRecordLog(log);
    window.open(directWaUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-xl w-full p-6 text-slate-900 relative my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Kirim Notifikasi WhatsApp Stok
              </h2>
              <p className="text-xs text-slate-500">
                Peringatan otomatis FEFO untuk {batch.productName} ({batch.batchNumber})
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

        <div className="mt-4 space-y-4">
          {/* Recipient Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pilih Tujuan Penerima Notifikasi:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setRecipientRole('owner')}
                className={`p-2 rounded-lg border text-left transition-colors ${
                  recipientRole === 'owner'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-semibold'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold">Owner UMKM</div>
                <div className="text-[10px] text-slate-500 font-mono truncate">{settings.ownerPhone}</div>
              </button>

              <button
                type="button"
                onClick={() => setRecipientRole('gudang')}
                className={`p-2 rounded-lg border text-left transition-colors ${
                  recipientRole === 'gudang'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-semibold'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold">Staf Gudang</div>
                <div className="text-[10px] text-slate-500 font-mono truncate">{settings.warehousePhone}</div>
              </button>

              <button
                type="button"
                onClick={() => setRecipientRole('kasir')}
                className={`p-2 rounded-lg border text-left transition-colors ${
                  recipientRole === 'kasir'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-semibold'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold">Kasir Toko</div>
                <div className="text-[10px] text-slate-500 font-mono truncate">{settings.cashierPhone}</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRecipientRole('supplier');
                  setAlertType('RETUR');
                }}
                className={`p-2 rounded-lg border text-left transition-colors ${
                  recipientRole === 'supplier'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-semibold'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold">Suplier Retur</div>
                <div className="text-[10px] text-slate-500 font-mono truncate">{batch.supplierPhone || 'N/A'}</div>
              </button>
            </div>
          </div>

          {/* Template / Alert Type Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tipe Peringatan / Template:
              </label>
              <select
                value={alertType}
                onChange={(e) => setAlertType(e.target.value as any)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-hidden focus:bg-white focus:border-slate-400"
              >
                <option value="H-0">H-0: Kedaluwarsa Hari Ini (Tarik Barang Segera)</option>
                <option value="H-3">H-3: Kritis Darurat (3 Hari Lagi)</option>
                <option value="H-7">H-7: Kritis Flash Sale (7 Hari Lagi)</option>
                <option value="H-14">H-14: Waspada Evaluasi Stok (14 Hari Lagi)</option>
                <option value="H-30">H-30: Monitoring FEFO Depan Rak (30 Hari Lagi)</option>
                <option value="RETUR">RETUR: Permohonan Pengembalian Barang ke Suplier</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor Tujuan Terpilih:
              </label>
              <div className="p-2 bg-slate-100 rounded-lg border border-slate-200 text-xs font-mono font-bold text-slate-800">
                {targetPhone || '(Nomor belum diisi)'} ({targetName})
              </div>
            </div>
          </div>

          {/* WhatsApp Message Bubble Preview */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Pratinjau Pesan WhatsApp:
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] text-emerald-700 hover:text-emerald-800 flex items-center gap-1 font-medium"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Tersalin' : 'Salin Teks'}</span>
              </button>
            </div>

            <div className="bg-[#EFEAE2] p-3 rounded-lg border border-slate-300">
              <div className="bg-white rounded-lg p-3 shadow-xs text-xs whitespace-pre-wrap font-sans text-slate-800 leading-relaxed border border-slate-100 max-h-56 overflow-y-auto">
                {message}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
            <span className="text-[11px] text-slate-500">
              Metode: <strong className="text-slate-700">{settings.whatsappProvider === 'wa_direct' ? 'WhatsApp Web / Mobile Click-to-Chat' : 'Gateway API Otomatis'}</strong>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleSendViaGateway}
                disabled={sendingState === 'sending'}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors"
              >
                {sendingState === 'sending' ? 'Mengirim...' : sendingState === 'success' ? 'Terkirim!' : 'Catat & Kirim API'}
              </button>

              <button
                type="button"
                onClick={handleOpenDirectWhatsApp}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka WhatsApp Langsung</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
