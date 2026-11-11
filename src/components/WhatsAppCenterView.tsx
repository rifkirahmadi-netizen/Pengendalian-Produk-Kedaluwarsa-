import React, { useState } from 'react';
import {
  Send,
  MessageSquare,
  Users,
  Settings,
  Bell,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Sliders,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Smartphone,
  Server,
  Copy,
  Check,
} from 'lucide-react';
import { AppSettings, BatchItem, WhatsAppLogItem } from '../types/inventory';
import {
  scanBatchesForDailyAlerts,
  sendWhatsAppViaProvider,
} from '../utils/whatsappService';
import { formatRupiah, getStatusMeta } from '../utils/fefoEngine';

interface WhatsAppCenterViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  batches: BatchItem[];
  simulatedDate: string;
  whatsAppLogs: WhatsAppLogItem[];
  onAddLogs: (logs: WhatsAppLogItem[]) => void;
  onClearLogs: () => void;
}

export const WhatsAppCenterView: React.FC<WhatsAppCenterViewProps> = ({
  settings,
  onUpdateSettings,
  batches,
  simulatedDate,
  whatsAppLogs,
  onAddLogs,
  onClearLogs,
}) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Scan state
  const [isScanning, setIsScanning] = useState(false);
  const [scannedAlerts, setScannedAlerts] = useState<ReturnType<typeof scanBatchesForDailyAlerts>>([]);
  const [hasScanned, setHasScanned] = useState(false);
  const [broadcastProgress, setBroadcastProgress] = useState<'idle' | 'running' | 'done'>('idle');

  // Handle settings save
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(localSettings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Run the automated daily scanner
  const handleRunDailyScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      const results = scanBatchesForDailyAlerts(batches, localSettings, simulatedDate);
      setScannedAlerts(results);
      setIsScanning(false);
      setHasScanned(true);
    }, 400);
  };

  // Broadcast all scanned alerts
  const handleBroadcastAll = async () => {
    if (scannedAlerts.length === 0) return;
    setBroadcastProgress('running');

    const newLogs: WhatsAppLogItem[] = [];

    for (const alert of scannedAlerts) {
      // Simulate/execute send
      await sendWhatsAppViaProvider(
        localSettings.customWebhookUrl,
        localSettings.apiKey,
        localSettings.whatsappProvider,
        alert.recipientPhone,
        alert.messageText
      );

      newLogs.push({
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        batchId: alert.batch.id,
        batchNumber: alert.batch.batchNumber,
        productName: alert.batch.productName,
        recipientPhone: alert.recipientPhone,
        recipientName: alert.recipientName,
        recipientRole: alert.recipientRole,
        alertType: alert.alertType,
        messageText: alert.messageText,
        status: 'Terkirim',
        provider: localSettings.whatsappProvider,
      });
    }

    onAddLogs(newLogs);
    setBroadcastProgress('done');
    setTimeout(() => {
      setBroadcastProgress('idle');
      setHasScanned(false);
    }, 2000);
  };

  // Test Gateway Connection
  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);

    const res = await sendWhatsAppViaProvider(
      localSettings.customWebhookUrl,
      localSettings.apiKey,
      localSettings.whatsappProvider,
      localSettings.ownerPhone,
      `*TEST KONEKSI SISTEM FEFO STOCKGUARD*\nHalo ${localSettings.ownerName}, koneksi gateway WhatsApp untuk ${localSettings.umkmName} berhasil diverifikasi!`
    );

    setTestingConnection(false);
    if (res.success) {
      setTestResult('Sukses: Gateway terhubung dan pesan uji coba berhasil diproses.');
    } else {
      setTestResult(`Gagal: ${res.error || 'Periksa URL Webhook atau Token API'}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Automated Scanner Trigger */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Pusat Otomasi Notifikasi WhatsApp Stok UMKM
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pindai semua stok barang dan kirim peringatan otomatis (H-30, H-14, H-7, H-3, H-0) ke pemilik, gudang, kasir, atau suplier.
              </p>
            </div>
          </div>

          <button
            onClick={handleRunDailyScan}
            disabled={isScanning}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors shadow-xs flex items-center gap-2 whitespace-nowrap self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Memindai Stok...' : 'Pindai Stok & Jalankan Alert Hari Ini'}</span>
          </button>
        </div>

        {/* Scan Results Panel */}
        {hasScanned && (
          <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="text-xs">
                <span className="font-semibold text-slate-900">
                  Hasil Pemindaian Stok Hari Ini ({simulatedDate}):
                </span>{' '}
                <span className="text-slate-600">
                  Ditemukan <strong className="font-mono text-emerald-800">{scannedAlerts.length}</strong> batch stok yang memerlukan notifikasi WhatsApp.
                </span>
              </div>

              {scannedAlerts.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBroadcastAll}
                    disabled={broadcastProgress === 'running'}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {broadcastProgress === 'running'
                        ? 'Memproses Broadcast...'
                        : broadcastProgress === 'done'
                        ? 'Semua Berhasil Dikirim!'
                        : `Kirim Semua (${scannedAlerts.length} Pesan WA)`}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {scannedAlerts.length === 0 ? (
              <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 text-center">
                Tidak ada batch stok yang memasuki batas ambang hari ini. Semua stok dalam kondisi terkendali.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto">
                {scannedAlerts.map((item, idx) => {
                  const meta = getStatusMeta(item.daysRemaining);
                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-white transition-colors text-xs flex flex-col justify-between gap-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 truncate">
                              {item.batch.productName}
                            </span>
                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${meta.badgeBg} ${meta.badgeText}`}>
                              {item.alertType}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Batch: <span className="font-mono text-slate-700">{item.batch.batchNumber}</span> · Sisa: {item.batch.currentStock} {item.batch.unit} · {item.batch.locationRack}
                          </div>
                        </div>

                        <a
                          href={item.waDirectUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors whitespace-nowrap inline-flex items-center gap-1 shrink-0"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Kirim WA</span>
                        </a>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Penerima: <strong className="text-slate-800">{item.recipientName} ({item.recipientRole})</strong></span>
                        <span className="font-mono">{item.recipientPhone}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main 2-Column Split: Settings on Left, History on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Configuration */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleSaveSettings} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Settings className="w-4 h-4 text-slate-700" />
                <span>Pengaturan Kontak & Notifikasi</span>
              </h2>
              {saveSuccess && (
                <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Tersimpan!</span>
                </span>
              )}
            </div>

            {/* Business & Owner Info */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama UMKM:
              </label>
              <input
                type="text"
                value={localSettings.umkmName}
                onChange={(e) => setLocalSettings({ ...localSettings, umkmName: e.target.value })}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-hidden focus:bg-white"
              />
            </div>

            {/* Stakeholder WhatsApp Numbers */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>Daftar Nomor WhatsApp Penerima</span>
              </h3>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                  Pemilik UMKM (Owner):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Nama Owner"
                    value={localSettings.ownerName}
                    onChange={(e) => setLocalSettings({ ...localSettings, ownerName: e.target.value })}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5"
                  />
                  <input
                    type="text"
                    placeholder="0812xxxx"
                    value={localSettings.ownerPhone}
                    onChange={(e) => setLocalSettings({ ...localSettings, ownerPhone: e.target.value })}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                  Bagian Gudang / Inventori:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Nama Gudang"
                    value={localSettings.warehouseName}
                    onChange={(e) => setLocalSettings({ ...localSettings, warehouseName: e.target.value })}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5"
                  />
                  <input
                    type="text"
                    placeholder="0819xxxx"
                    value={localSettings.warehousePhone}
                    onChange={(e) => setLocalSettings({ ...localSettings, warehousePhone: e.target.value })}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                  Kasir Toko (Frontline):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Nama Kasir"
                    value={localSettings.cashierName}
                    onChange={(e) => setLocalSettings({ ...localSettings, cashierName: e.target.value })}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5"
                  />
                  <input
                    type="text"
                    placeholder="0857xxxx"
                    value={localSettings.cashierPhone}
                    onChange={(e) => setLocalSettings({ ...localSettings, cashierPhone: e.target.value })}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Threshold check boxes */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-800">
                Pemicu Otomatis Batas Hari (Alert Thresholds):
              </label>
              <div className="grid grid-cols-5 gap-1.5 text-xs text-center font-mono">
                {[30, 14, 7, 3, 0].map((day) => {
                  const isChecked = localSettings.autoNotifyDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        const newDays = isChecked
                          ? localSettings.autoNotifyDays.filter((d) => d !== day)
                          : [...localSettings.autoNotifyDays, day].sort((a, b) => b - a);
                        setLocalSettings({ ...localSettings, autoNotifyDays: newDays });
                      }}
                      className={`py-1.5 rounded border transition-colors ${
                        isChecked
                          ? 'bg-slate-900 text-white font-bold border-slate-900'
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      H-{day}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-500">
                H-30 (Monitoring) · H-14 (Evaluasi) · H-7 (Flash Sale) · H-3 (Darurat) · H-0 (Expired)
              </p>
            </div>

            {/* Gateway Provider Selection */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-800">
                Moda Pengiriman WhatsApp:
              </label>
              <div className="space-y-1.5 text-xs">
                <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="radio"
                    name="provider"
                    checked={localSettings.whatsappProvider === 'wa_direct'}
                    onChange={() => setLocalSettings({ ...localSettings, whatsappProvider: 'wa_direct' })}
                    className="text-emerald-600"
                  />
                  <div>
                    <span className="font-semibold text-slate-900 block">
                      WhatsApp Direct (Gratis & 100% Aman)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Menggunakan tautan wa.me resmi tanpa resiko banned.
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="radio"
                    name="provider"
                    checked={localSettings.whatsappProvider === 'fonnte'}
                    onChange={() => setLocalSettings({ ...localSettings, whatsappProvider: 'fonnte' })}
                    className="text-emerald-600"
                  />
                  <div>
                    <span className="font-semibold text-slate-900 block">
                      Fonnte / Wablas API Gateway
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Gateway pengiriman otomatis via REST API.
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="radio"
                    name="provider"
                    checked={localSettings.whatsappProvider === 'custom_webhook'}
                    onChange={() => setLocalSettings({ ...localSettings, whatsappProvider: 'custom_webhook' })}
                    className="text-emerald-600"
                  />
                  <div>
                    <span className="font-semibold text-slate-900 block">
                      Custom Webhook / n8n / Make
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Kirim payload JSON ke URL webhook server UMKM Anda.
                    </span>
                  </div>
                </label>
              </div>

              {localSettings.whatsappProvider !== 'wa_direct' && (
                <div className="pt-2 space-y-2">
                  <input
                    type="text"
                    placeholder="API Token / Key Gateway"
                    value={localSettings.apiKey}
                    onChange={(e) => setLocalSettings({ ...localSettings, apiKey: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
                  />
                  {localSettings.whatsappProvider === 'custom_webhook' && (
                    <input
                      type="url"
                      placeholder="https://api.domainumkm.com/whatsapp-webhook"
                      value={localSettings.customWebhookUrl}
                      onChange={(e) => setLocalSettings({ ...localSettings, customWebhookUrl: e.target.value })}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
                    />
                  )}
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testingConnection}
                    className="px-3 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                  >
                    {testingConnection ? 'Menguji Koneksi...' : 'Uji Koneksi Gateway'}
                  </button>
                  {testResult && (
                    <div className="p-2 rounded bg-slate-100 text-[11px] text-slate-700 font-mono">
                      {testResult}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2 px-3 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
            >
              Simpan Konfigurasi WhatsApp
            </button>
          </form>
        </div>

        {/* Right Column (7 Cols): WhatsApp Message History Logs */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-700" />
                  <span>Log Riwayat Pesan WhatsApp Terkirim</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Audit pencatatan seluruh notifikasi stok kedaluwarsa yang telah dipicu sistem.
                </p>
              </div>

              {whatsAppLogs.length > 0 && (
                <button
                  onClick={onClearLogs}
                  className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors"
                >
                  Bersihkan Log
                </button>
              )}
            </div>

            <div className="mt-4 divide-y divide-slate-100 max-h-[580px] overflow-y-auto">
              {whatsAppLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-medium text-slate-700">Belum ada riwayat pengiriman notifikasi.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Gunakan tombol "Pindai Stok & Jalankan Alert" di atas untuk memicu notifikasi batch pertama.
                  </p>
                </div>
              ) : (
                whatsAppLogs.map((log) => (
                  <div key={log.id} className="py-3 hover:bg-slate-50/60 rounded px-1 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">
                            {log.productName}
                          </span>
                          <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                            {log.alertType}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {log.batchNumber}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                          <span>Penerima: <strong className="text-slate-800">{log.recipientName} ({log.recipientRole})</strong></span>
                          <span>·</span>
                          <span className="font-mono">{log.recipientPhone}</span>
                          <span>·</span>
                          <span>{log.timestamp}</span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5">
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {log.status}
                        </span>
                      </div>
                    </div>

                    <div className="mt-1.5 bg-slate-50 rounded p-2 text-[11px] text-slate-600 font-sans whitespace-pre-wrap border border-slate-100 line-clamp-3 hover:line-clamp-none transition-all">
                      {log.messageText}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-4 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Total Catatan Notifikasi: <strong className="font-mono text-slate-800">{whatsAppLogs.length}</strong></span>
            <span>Semua log tersimpan secara persisten di penyimpanan browser lokal.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
