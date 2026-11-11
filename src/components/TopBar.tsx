import React from 'react';
import { ShieldCheck, Plus, Bell, RefreshCw } from 'lucide-react';

interface TopBarProps {
  activeTab: 'dashboard' | 'stock' | 'dispatch' | 'whatsapp' | 'report';
  setActiveTab: (tab: 'dashboard' | 'stock' | 'dispatch' | 'whatsapp' | 'report') => void;
  onOpenAddBatch: () => void;
  onOpenFefoDispatch: () => void;
  onTriggerDailyScan: () => void;
  pendingAlertsCount: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddBatch,
  onOpenFefoDispatch,
  onTriggerDailyScan,
  pendingAlertsCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6 h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-emerald-700 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900 block leading-tight">
                FEFO StockGuard
              </span>
              <span className="text-[11px] text-slate-700 font-medium tracking-wide">
                Pengendalian Kedaluwarsa UMKM
              </span>
            </div>
          </div>

          {/* Zone 2: 4–5 clean single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2 text-sm font-medium">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 text-xs sm:text-sm ${
                activeTab === 'dashboard'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Ringkasan FEFO
            </button>
            <button
              onClick={() => setActiveTab('stock')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 text-xs sm:text-sm ${
                activeTab === 'stock'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Daftar Stok & Batch
            </button>
            <button
              onClick={() => setActiveTab('dispatch')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 text-xs sm:text-sm ${
                activeTab === 'dispatch'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Kasir / Ambil Stok FEFO
            </button>
            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 text-xs sm:text-sm relative ${
                activeTab === 'whatsapp'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Notifikasi WhatsApp
              {pendingAlertsCount > 0 && (
                <span className="ml-1.5 text-xs font-mono font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded-full">
                  {pendingAlertsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 text-xs sm:text-sm ${
                activeTab === 'report'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Laporan & Audit BAST
            </button>
          </nav>

          {/* Zone 3: 1 primary action or clean cluster */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onTriggerDailyScan}
              title="Pindai stok & kirim otomatis notifikasi WhatsApp"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors whitespace-nowrap shrink-0"
            >
              <Bell className="w-3.5 h-3.5 text-emerald-700" />
              <span>Pindai Alert WA</span>
            </button>
            <button
              onClick={onOpenAddBatch}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Batch Baru</span>
            </button>
          </div>
        </div>

        {/* Mobile Nav Links */}
        <div className="flex md:hidden overflow-x-auto py-2 gap-1 border-t border-slate-100 text-xs no-scrollbar">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-slate-900 text-white font-medium' : 'text-slate-600'}`}
          >
            Ringkasan
          </button>
          <button
            onClick={() => setActiveTab('stock')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'stock' ? 'bg-slate-900 text-white font-medium' : 'text-slate-600'}`}
          >
            Stok & Batch
          </button>
          <button
            onClick={() => setActiveTab('dispatch')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'dispatch' ? 'bg-slate-900 text-white font-medium' : 'text-slate-600'}`}
          >
            Kasir FEFO
          </button>
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'whatsapp' ? 'bg-slate-900 text-white font-medium' : 'text-slate-600'}`}
          >
            WhatsApp {pendingAlertsCount > 0 ? `(${pendingAlertsCount})` : ''}
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'report' ? 'bg-slate-900 text-white font-medium' : 'text-slate-600'}`}
          >
            Laporan
          </button>
        </div>
      </div>
    </header>
  );
};
