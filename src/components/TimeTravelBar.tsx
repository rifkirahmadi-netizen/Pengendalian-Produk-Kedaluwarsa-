import React from 'react';
import { Calendar, ChevronRight, RotateCcw, Sparkles } from 'lucide-react';
import { formatDateIndo } from '../utils/fefoEngine';

interface TimeTravelBarProps {
  currentDateStr: string;
  onSetDate: (newDate: string) => void;
  onResetToday: () => void;
  umkmName: string;
}

export const TimeTravelBar: React.FC<TimeTravelBarProps> = ({
  currentDateStr,
  onSetDate,
  onResetToday,
  umkmName,
}) => {
  const addDays = (days: number) => {
    const d = new Date(currentDateStr);
    d.setDate(d.getDate() + days);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    onSetDate(`${yyyy}-${mm}-${dd}`);
  };

  const isToday = currentDateStr === '2026-11-11';

  return (
    <div className="bg-slate-900 text-white border-b border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-3">
        {/* Left side: Business identity & System Date */}
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-200 truncate max-w-[200px] sm:max-w-none">
            {umkmName}
          </span>
          <span className="text-slate-600 hidden sm:inline" aria-hidden="true">·</span>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tanggal Sistem:</span>
            <span className="font-mono font-medium text-white tabular-nums bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              {formatDateIndo(currentDateStr)} ({currentDateStr})
            </span>
          </div>
        </div>

        {/* Right side: Simulation controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 hidden md:inline">Uji Simulasi Waktu FEFO:</span>
          <div className="inline-flex items-center bg-slate-800 rounded-md p-0.5 border border-slate-700">
            <button
              onClick={() => addDays(3)}
              className="px-2 py-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors whitespace-nowrap"
              title="Majukan 3 Hari ke Depan"
            >
              +3 Hari
            </button>
            <button
              onClick={() => addDays(7)}
              className="px-2 py-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors whitespace-nowrap"
              title="Majukan 7 Hari (Uji Peringatan H-7)"
            >
              +7 Hari
            </button>
            <button
              onClick={() => addDays(14)}
              className="px-2 py-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors whitespace-nowrap"
              title="Majukan 14 Hari"
            >
              +14 Hari
            </button>
            <button
              onClick={() => addDays(30)}
              className="px-2 py-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors whitespace-nowrap"
              title="Majukan 1 Bulan"
            >
              +30 Hari
            </button>
          </div>

          <input
            type="date"
            value={currentDateStr}
            onChange={(e) => e.target.value && onSetDate(e.target.value)}
            className="bg-slate-800 text-white border border-slate-700 rounded px-2 py-1 text-xs focus:outline-hidden focus:border-emerald-500 font-mono"
            title="Pilih tanggal kustom untuk menguji umur simpan stok"
          />

          {!isToday && (
            <button
              onClick={onResetToday}
              className="inline-flex items-center gap-1 text-slate-400 hover:text-emerald-400 px-1.5 py-1 transition-colors"
              title="Kembalikan ke tanggal asli (11 Nov 2026)"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
