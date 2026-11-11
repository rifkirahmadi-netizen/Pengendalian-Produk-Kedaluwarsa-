import React, { useState, useEffect } from 'react';
import {
  INITIAL_BATCHES,
  INITIAL_PRODUCTS,
  INITIAL_SETTINGS,
  INITIAL_WHATSAPP_LOGS,
  INITIAL_MOVEMENTS,
} from './data/initialData';
import {
  BatchItem,
  Product,
  AppSettings,
  WhatsAppLogItem,
  StockMovement,
} from './types/inventory';
import { TopBar } from './components/TopBar';
import { TimeTravelBar } from './components/TimeTravelBar';
import { DashboardView } from './components/DashboardView';
import { StockListView } from './components/StockListView';
import { FefoDispatchModal } from './components/FefoDispatchModal';
import { AddBatchModal } from './components/AddBatchModal';
import { SendWhatsAppModal } from './components/SendWhatsAppModal';
import { BarcodeLabelModal } from './components/BarcodeLabelModal';
import { WhatsAppCenterView } from './components/WhatsAppCenterView';
import { ReportView } from './components/ReportView';
import { EditBatchModal } from './components/EditBatchModal';
import { scanBatchesForDailyAlerts } from './utils/whatsappService';

const STORAGE_KEY_BATCHES = 'fefo_stockguard_batches_v1';
const STORAGE_KEY_PRODUCTS = 'fefo_stockguard_products_v1';
const STORAGE_KEY_SETTINGS = 'fefo_stockguard_settings_v1';
const STORAGE_KEY_LOGS = 'fefo_stockguard_walogs_v1';
const STORAGE_KEY_MOVEMENTS = 'fefo_stockguard_movements_v1';

export default function App() {
  // Load state from localStorage or default
  const [batches, setBatches] = useState<BatchItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BATCHES);
      return saved ? JSON.parse(saved) : INITIAL_BATCHES;
    } catch {
      return INITIAL_BATCHES;
    }
  });

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PRODUCTS);
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  const [whatsAppLogs, setWhatsAppLogs] = useState<WhatsAppLogItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOGS);
      return saved ? JSON.parse(saved) : INITIAL_WHATSAPP_LOGS;
    } catch {
      return INITIAL_WHATSAPP_LOGS;
    }
  });

  const [movements, setMovements] = useState<StockMovement[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MOVEMENTS);
      return saved ? JSON.parse(saved) : INITIAL_MOVEMENTS;
    } catch {
      return INITIAL_MOVEMENTS;
    }
  });

  // Current simulated system date (defaults to 2026-11-11)
  const [simulatedDate, setSimulatedDate] = useState<string>(
    settings.simulatedCurrentDate || '2026-11-11'
  );

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'stock' | 'dispatch' | 'whatsapp' | 'report'
  >('dashboard');

  // Stock filter shortcut from dashboard
  const [stockStatusFilter, setStockStatusFilter] = useState<string>('ALL');

  // Modals state
  const [isAddBatchOpen, setIsAddBatchOpen] = useState(false);
  const [isFefoDispatchOpen, setIsFefoDispatchOpen] = useState(false);
  const [dispatchDefaultProductId, setDispatchDefaultProductId] = useState<string | undefined>();
  const [selectedBatchForWhatsApp, setSelectedBatchForWhatsApp] = useState<BatchItem | null>(null);
  const [selectedBatchForBarcode, setSelectedBatchForBarcode] = useState<BatchItem | null>(null);
  const [selectedBatchForEdit, setSelectedBatchForEdit] = useState<BatchItem | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BATCHES, JSON.stringify(batches));
    } catch (e) {
      console.error(e);
    }
  }, [batches]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.error(e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error(e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(whatsAppLogs));
    } catch (e) {
      console.error(e);
    }
  }, [whatsAppLogs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MOVEMENTS, JSON.stringify(movements));
    } catch (e) {
      console.error(e);
    }
  }, [movements]);

  // Compute pending alerts count for header badge
  const pendingAlerts = scanBatchesForDailyAlerts(batches, settings, simulatedDate);

  // Handlers
  const handleSetSimulatedDate = (newDate: string) => {
    setSimulatedDate(newDate);
    setSettings((prev) => ({ ...prev, simulatedCurrentDate: newDate }));
  };

  const handleResetToday = () => {
    handleSetSimulatedDate('2026-11-11');
  };

  const handleAddBatch = (newBatchData: Omit<BatchItem, 'id'>, newProduct?: Product) => {
    const newId = `batch-${Date.now()}`;
    const fullBatch: BatchItem = {
      id: newId,
      ...newBatchData,
    };

    if (newProduct) {
      setProducts((prev) => [newProduct, ...prev]);
    }

    setBatches((prev) => [fullBatch, ...prev]);

    // Record Inward Movement
    const move: StockMovement = {
      id: `mov-${Date.now()}`,
      timestamp: `${simulatedDate} ${new Date().toTimeString().slice(0, 8)}`,
      batchId: newId,
      batchNumber: fullBatch.batchNumber,
      productId: fullBatch.productId,
      productName: fullBatch.productName,
      type: 'IN',
      quantity: fullBatch.initialStock,
      reason: 'Penerimaan Stok Masuk Baru (Registrasi Batch)',
      actor: settings.warehouseName,
      isFefoCompliant: true,
    };
    setMovements((prev) => [move, ...prev]);
  };

  const handleSaveEditedBatch = (updated: BatchItem) => {
    setBatches((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  };

  const handleDeleteBatch = (batchId: string) => {
    setBatches((prev) => prev.filter((b) => b.id !== batchId));
  };

  const handleConfirmDispatch = (
    productId: string,
    allocations: { batchId: string; quantity: number }[],
    reason: string,
    actor: string
  ) => {
    const timestamp = `${simulatedDate} ${new Date().toTimeString().slice(0, 8)}`;
    const newMovements: StockMovement[] = [];

    setBatches((prevBatches) =>
      prevBatches.map((batch) => {
        const alloc = allocations.find((a) => a.batchId === batch.id);
        if (!alloc) return batch;

        const deductedStock = Math.max(0, batch.currentStock - alloc.quantity);

        newMovements.push({
          id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          timestamp,
          batchId: batch.id,
          batchNumber: batch.batchNumber,
          productId: batch.productId,
          productName: batch.productName,
          type: reason.includes('Retur')
            ? 'OUT_RETURN'
            : reason.includes('Pemusnahan')
            ? 'OUT_EXPIRED'
            : 'OUT_SALE',
          quantity: alloc.quantity,
          reason,
          actor,
          isFefoCompliant: true,
        });

        return {
          ...batch,
          currentStock: deductedStock,
        };
      })
    );

    setMovements((prev) => [...newMovements, ...prev]);
  };

  const handleRecordWhatsAppLog = (log: WhatsAppLogItem) => {
    setWhatsAppLogs((prev) => [log, ...prev]);
  };

  const handleAddMultipleWhatsAppLogs = (newLogs: WhatsAppLogItem[]) => {
    setWhatsAppLogs((prev) => [...newLogs, ...prev]);
  };

  const handleClearWhatsAppLogs = () => {
    setWhatsAppLogs([]);
  };

  const handleTriggerDailyScan = () => {
    setActiveTab('whatsapp');
  };

  const handleNavigateToStockWithFilter = (status?: string) => {
    setStockStatusFilter(status || 'ALL');
    setActiveTab('stock');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      {/* 1. Time Travel & Simulation Bar */}
      <TimeTravelBar
        currentDateStr={simulatedDate}
        onSetDate={handleSetSimulatedDate}
        onResetToday={handleResetToday}
        umkmName={settings.umkmName}
      />

      {/* 2. Top Navigation Bar (Obeying 3-Zone Top Bar Contract) */}
      <TopBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddBatch={() => setIsAddBatchOpen(true)}
        onOpenFefoDispatch={() => {
          setDispatchDefaultProductId(products[0]?.id);
          setIsFefoDispatchOpen(true);
        }}
        onTriggerDailyScan={handleTriggerDailyScan}
        pendingAlertsCount={pendingAlerts.length}
      />

      {/* 3. Main Application Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            batches={batches}
            simulatedDate={simulatedDate}
            settings={settings}
            whatsAppLogs={whatsAppLogs}
            onOpenFefoDispatch={() => {
              setDispatchDefaultProductId(products[0]?.id);
              setIsFefoDispatchOpen(true);
            }}
            onOpenSendWhatsApp={(batch) => setSelectedBatchForWhatsApp(batch)}
            onNavigateToStock={handleNavigateToStockWithFilter}
            onNavigateToWhatsApp={() => setActiveTab('whatsapp')}
            onTriggerDailyScan={handleTriggerDailyScan}
          />
        )}

        {activeTab === 'stock' && (
          <StockListView
            batches={batches}
            simulatedDate={simulatedDate}
            onOpenAddBatch={() => setIsAddBatchOpen(true)}
            onOpenSendWhatsApp={(batch) => setSelectedBatchForWhatsApp(batch)}
            onOpenBarcodeModal={(batch) => setSelectedBatchForBarcode(batch)}
            onEditBatch={(batch) => setSelectedBatchForEdit(batch)}
            onDeleteBatch={handleDeleteBatch}
            initialStatusFilter={stockStatusFilter}
          />
        )}

        {activeTab === 'dispatch' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="max-w-xl mx-auto text-center space-y-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Modul Kasir & Pengeluaran Stok FEFO
                </h2>
                <p className="text-xs text-slate-600">
                  Sistem menjamin prinsip First Expired, First Out. Petugas kasir atau staf gudang tidak perlu lagi mencari manual batch mana yang harus dikeluarkan lebih dahulu.
                </p>
                <div className="pt-3">
                  <button
                    onClick={() => {
                      setDispatchDefaultProductId(products[0]?.id);
                      setIsFefoDispatchOpen(true);
                    }}
                    className="px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
                  >
                    Mulai Ambil Stok Produk (FEFO Engine)
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Outward Movements Table */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900">
                Riwayat Pengeluaran Stok Terakhir
              </h3>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-semibold text-slate-600 border-b border-slate-200">
                      <th className="p-2.5">Waktu</th>
                      <th className="p-2.5">Produk</th>
                      <th className="p-2.5">No. Batch</th>
                      <th className="p-2.5 text-right">Jumlah Diambil</th>
                      <th className="p-2.5">Tujuan / Alasan</th>
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
                        <td className="p-2.5 text-right font-mono font-bold">{m.quantity}</td>
                        <td className="p-2.5 text-slate-600">{m.reason}</td>
                        <td className="p-2.5 text-slate-800 font-medium">{m.actor}</td>
                        <td className="p-2.5 text-center">
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            FEFO Sesuai
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'whatsapp' && (
          <WhatsAppCenterView
            settings={settings}
            onUpdateSettings={setSettings}
            batches={batches}
            simulatedDate={simulatedDate}
            whatsAppLogs={whatsAppLogs}
            onAddLogs={handleAddMultipleWhatsAppLogs}
            onClearLogs={handleClearWhatsAppLogs}
          />
        )}

        {activeTab === 'report' && (
          <ReportView
            batches={batches}
            movements={movements}
            simulatedDate={simulatedDate}
            settings={settings}
          />
        )}
      </main>

      {/* 4. Modals */}
      <AddBatchModal
        isOpen={isAddBatchOpen}
        onClose={() => setIsAddBatchOpen(false)}
        products={products}
        simulatedDate={simulatedDate}
        onAddBatch={handleAddBatch}
      />

      <FefoDispatchModal
        isOpen={isFefoDispatchOpen}
        onClose={() => setIsFefoDispatchOpen(false)}
        products={products}
        batches={batches}
        simulatedDate={simulatedDate}
        onConfirmDispatch={handleConfirmDispatch}
        defaultProductId={dispatchDefaultProductId}
      />

      <SendWhatsAppModal
        isOpen={!!selectedBatchForWhatsApp}
        onClose={() => setSelectedBatchForWhatsApp(null)}
        batch={selectedBatchForWhatsApp}
        settings={settings}
        simulatedDate={simulatedDate}
        onRecordLog={handleRecordWhatsAppLog}
      />

      <BarcodeLabelModal
        isOpen={!!selectedBatchForBarcode}
        onClose={() => setSelectedBatchForBarcode(null)}
        batch={selectedBatchForBarcode}
        simulatedDate={simulatedDate}
        umkmName={settings.umkmName}
      />

      <EditBatchModal
        isOpen={!!selectedBatchForEdit}
        onClose={() => setSelectedBatchForEdit(null)}
        batch={selectedBatchForEdit}
        simulatedDate={simulatedDate}
        onSave={handleSaveEditedBatch}
      />

      {/* 5. Quiet Clean Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div>
            <span className="font-semibold text-slate-700">{settings.umkmName}</span>
            <span className="mx-2 text-slate-400" aria-hidden="true">·</span>
            <span>Sistem Pengendalian Produk Kedaluwarsa Berbasis FEFO & Notifikasi Otomatis WhatsApp</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Standar Manajemen Umur Simpan Pangan & Produk UMKM
          </div>
        </div>
      </footer>
    </div>
  );
}
